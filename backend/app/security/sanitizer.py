import re
from pathlib import Path


class SecuritySanitizer:
    """
    Defense-in-depth sanitization for file paths, commands, and untrusted inputs.
    """
    
    # Allowed executable binaries
    ALLOWED_EXECUTABLES = {
        "git", "git.exe",
        "mvn", "mvn.cmd",
        "gradle", "gradle.bat",
        "npm", "npm.cmd",
        "pytest",
        "python", "python.exe"
    }
    
    # Safe Git subcommands (Read-Only by default)
    ALLOWED_GIT_SUBCOMMANDS = {
        "status", "branch", "log", "diff", "show", "rev-parse"
    }
    
    # Shell meta-characters forbidden in any argument
    DANGEROUS_SHELL_CHARS = re.compile(r"[;&|`$><\n\r]")
    
    @classmethod
    def canonicalize_path(cls, target_path: str, allowlisted_roots: list[str]) -> Path:
        """
        Ensures target_path resolves strictly within one of the allowlisted roots.
        Prevents Path Traversal (e.g. ../../Windows/System32).
        """
        try:
            resolved_target = Path(target_path).resolve()
        except Exception as e:
            raise ValueError(f"Đường dẫn không hợp lệ: {target_path} ({e})")
            
        for root in allowlisted_roots:
            try:
                resolved_root = Path(root).resolve()
                if resolved_target == resolved_root or resolved_target.is_relative_to(resolved_root):
                    return resolved_target
            except Exception:
                continue
                
        raise PermissionError(
            f"Truy cập tệp tin bị từ chối: Đường dẫn '{target_path}' nằm ngoài danh mục dự án được cấp phép."
        )

    @classmethod
    def validate_command(cls, command_args: list[str]) -> tuple[str, list[str]]:
        """
        Validates executable and arguments against strict allowlist.
        Never runs with shell=True.
        """
        if not command_args:
            raise ValueError("Lệnh thực thi không được rỗng.")
            
        executable = command_args[0].lower()
        base_exec = Path(executable).name
        
        if base_exec not in cls.ALLOWED_EXECUTABLES:
            raise PermissionError(f"Thực thi bị từ chối: Chương trình '{base_exec}' không nằm trong danh mục cho phép.")
            
        # Check all arguments for forbidden shell meta-characters
        for arg in command_args[1:]:
            if cls.DANGEROUS_SHELL_CHARS.search(arg):
                raise ValueError(f"Tham số chứa ký tự shell nguy hiểm: '{arg}'")
                
        # Specialized check for Git commands
        if base_exec in {"git", "git.exe"}:
            if len(command_args) < 2:
                raise ValueError("Lệnh Git thiếu lệnh con (subcommand).")
            subcommand = command_args[1].lower()
            if subcommand not in cls.ALLOWED_GIT_SUBCOMMANDS:
                raise PermissionError(
                    f"Thao tác Git bị từ chối: Lệnh con '{subcommand}' không được phép trong chế độ an toàn."
                )
                
        return executable, command_args[1:]

    @classmethod
    def sanitize_untrusted_text(cls, text: str, source_type: str = "email") -> str:
        """
        Sanitizes untrusted text (emails, external files) to defend against prompt injection.
        Wraps content in isolated delimiters and strips instruction-override sequences.
        """
        if not text:
            return ""
            
        # Neutralize common prompt injection patterns
        injection_patterns = [
            r"ignore (all )?previous instructions",
            r"system\s*prompt",
            r"<\s*script\s*>",
            r"\[INST\]",
            r"\[/INST\]",
            r"<<SYS>>",
            r"<\|im_start\|>",
            r"<\|im_end\|>"
        ]
        
        sanitized = text
        for pat in injection_patterns:
            sanitized = re.sub(pat, "[FILTERED_INSTRUCTION]", sanitized, flags=re.IGNORECASE)
            
        return (
            f"\n--- BẮT ĐẦU DỮ LIỆU NGOẠI VI ({source_type.upper()} - KHÔNG TIN CẬY) ---\n"
            f"{sanitized}\n"
            f"--- KẾT THÚC DỮ LIỆU NGOẠI VI ---\n"
        )
