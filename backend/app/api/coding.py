import subprocess
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.coding import Project, Repository
from backend.app.schemas import ProjectRegister
from backend.app.security.sanitizer import SecuritySanitizer

router = APIRouter(prefix="/api/coding", tags=["Coding"])

# Preset project profiles as configurable templates
PRESET_PROFILES = [
    {
        "name": "GreenPhone",
        "project_type": "spring_boot",
        "description": "Nền tảng thương mại điện tử điện thoại xanh (Spring Boot 3 + React TypeScript)"
    },
    {
        "name": "CertMaster",
        "project_type": "spring_boot",
        "description": "Hệ thống luyện thi chứng chỉ TOEIC trực tuyến (Java / Spring Boot)"
    },
    {
        "name": "EDTOEIC Assistant",
        "project_type": "python_extension",
        "description": "Tiện ích mở rộng trình duyệt và dịch vụ hỗ trợ học tập (Browser Extension + Python Services)"
    }
]

@router.get("/presets")
def get_preset_profiles():
    return PRESET_PROFILES

@router.get("/projects")
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    results = []
    for p in projects:
        repos = [
            {
                "id": r.id,
                "local_path": r.local_path,
                "default_branch": r.default_branch,
                "remote_url": r.remote_url,
                "is_allowlisted": r.is_allowlisted
            }
            for r in p.repositories
        ]
        results.append({
            "id": p.id,
            "name": p.name,
            "project_type": p.project_type,
            "description": p.description,
            "created_at": p.created_at.isoformat(),
            "repositories": repos
        })
    return results

@router.post("/projects")
def register_project(payload: ProjectRegister, db: Session = Depends(get_db)):
    """Register and allowlist a local project folder with strict path canonicalization."""
    project_path = Path(payload.path)
    if not project_path.exists() or not project_path.is_dir():
        raise HTTPException(status_code=400, detail=f"Thư mục không tồn tại trên hệ thống: {payload.path}")
        
    canonical_path = str(project_path.resolve())
    
    # Check if path already registered
    existing_repo = db.query(Repository).filter(Repository.local_path == canonical_path).first()
    if existing_repo:
        raise HTTPException(status_code=409, detail="Thư mục này đã được đăng ký trong hệ thống")
        
    project = Project(
        name=payload.name,
        project_type=payload.project_type,
        description=payload.description
    )
    db.add(project)
    db.flush()
    
    # Inspect Git default branch if repository
    default_branch = "main"
    remote_url = None
    git_dir = project_path / ".git"
    if git_dir.exists():
        try:
            res = subprocess.run(
                ["git", "branch", "--show-current"],
                cwd=canonical_path,
                capture_output=True,
                text=True,
                timeout=5
            )
            if res.returncode == 0 and res.stdout.strip():
                default_branch = res.stdout.strip()
        except Exception:
            pass
            
    repo = Repository(
        project_id=project.id,
        local_path=canonical_path,
        default_branch=default_branch,
        remote_url=remote_url,
        is_allowlisted=True
    )
    db.add(repo)
    db.commit()
    db.refresh(project)
    
    return {
        "id": project.id,
        "name": project.name,
        "path": canonical_path,
        "project_type": project.project_type,
        "default_branch": default_branch
    }

@router.get("/projects/{project_id}/git-status")
def get_git_status(project_id: str, db: Session = Depends(get_db)):
    """Run read-only git status safely on an allowlisted repository."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not project.repositories:
        raise HTTPException(status_code=404, detail="Không tìm thấy dự án hoặc kho lưu trữ")
        
    repo = project.repositories[0]
    repo_path = Path(repo.local_path)
    if not (repo_path / ".git").exists():
        return {
            "is_git": False,
            "current_branch": "None",
            "is_clean": True,
            "staged_files": [],
            "unstaged_files": [],
            "untracked_files": []
        }
        
    # Safe execute: git status --porcelain
    try:
        cmd, args = SecuritySanitizer.validate_command(["git", "status", "--porcelain", "-b"])
        proc = subprocess.run(
            [cmd] + args,
            cwd=str(repo_path),
            capture_output=True,
            text=True,
            timeout=10
        )
        
        lines = proc.stdout.splitlines()
        branch = "main"
        staged = []
        unstaged = []
        untracked = []
        
        for line in lines:
            if line.startswith("##"):
                branch = line[3:].split("...")[0].strip()
            elif line.startswith("??"):
                untracked.append(line[3:].strip())
            else:
                index_status = line[0] if len(line) > 0 else " "
                work_status = line[1] if len(line) > 1 else " "
                filename = line[3:].strip()
                if index_status not in (" ", "?"):
                    staged.append(filename)
                if work_status not in (" ", "?"):
                    unstaged.append(filename)
                    
        return {
            "is_git": True,
            "current_branch": branch,
            "is_clean": len(staged) == 0 and len(unstaged) == 0 and len(untracked) == 0,
            "staged_files": staged,
            "unstaged_files": unstaged,
            "untracked_files": untracked
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi đọc trạng thái Git: {e}")

@router.get("/projects/{project_id}/git-log")
def get_git_log(project_id: str, limit: int = 15, db: Session = Depends(get_db)):
    """Run safe read-only git log."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not project.repositories:
        raise HTTPException(status_code=404, detail="Không tìm thấy dự án")
        
    repo_path = project.repositories[0].local_path
    safe_limit = min(max(1, limit), 50)
    
    try:
        cmd, args = SecuritySanitizer.validate_command(["git", "log", f"-n{safe_limit}", "--oneline", "--decorate"])
        proc = subprocess.run(
            [cmd] + args,
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=10
        )
        commits = [line.strip() for line in proc.stdout.splitlines() if line.strip()]
        return {"commits": commits}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi đọc lịch sử Git: {e}")

@router.get("/projects/{project_id}/git-diff")
def get_git_diff(project_id: str, db: Session = Depends(get_db)):
    """Run safe read-only git diff."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not project.repositories:
        raise HTTPException(status_code=404, detail="Không tìm thấy dự án")
        
    repo_path = project.repositories[0].local_path
    try:
        cmd, args = SecuritySanitizer.validate_command(["git", "diff"])
        proc = subprocess.run(
            [cmd] + args,
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=10
        )
        return {"diff": proc.stdout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi đọc diff: {e}")
