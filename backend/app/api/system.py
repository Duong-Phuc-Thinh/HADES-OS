import platform

import psutil
from fastapi import APIRouter

from backend.app.schemas import HardwareMetric

router = APIRouter(prefix="/api/system", tags=["System"])

def get_gpu_info() -> tuple[str, float | None]:
    """Attempt to detect GPU information safely on Windows without fabricating data."""
    try:
        # Check if nvidia-smi exists or use standard Windows DX/WMI query
        import subprocess
        result = subprocess.run(
            ["wmic", "path", "win32_VideoController", "get", "name"],
            capture_output=True,
            text=True,
            timeout=2
        )
        lines = [line.strip() for line in result.stdout.split("\n") if line.strip() and "Name" not in line]
        if lines:
            gpu_name = lines[0]
            # GPU load percentage is not reliably available without vendor SDKs; report None
            return gpu_name, None
    except Exception:
        pass
    return "Không hỗ trợ", None

@router.get("/metrics", response_model=HardwareMetric)
def get_system_metrics():
    """Retrieve actual Windows system metrics."""
    # CPU
    cpu_percent = psutil.cpu_percent(interval=None)
    
    # RAM
    vmem = psutil.virtual_memory()
    memory_percent = vmem.percent
    memory_used_mb = round(vmem.used / (1024 * 1024), 2)
    memory_total_mb = round(vmem.total / (1024 * 1024), 2)
    
    # Disk (drive containing the app data or C:)
    disk = psutil.disk_usage("C:\\" if platform.system() == "Windows" else "/")
    disk_percent = disk.percent
    disk_free_gb = round(disk.free / (1024 * 1024 * 1024), 2)
    
    # Network I/O
    net = psutil.net_io_counters()
    net_sent_kb = round(net.bytes_sent / 1024, 2)
    net_recv_kb = round(net.bytes_recv / 1024, 2)
    
    gpu_name, gpu_percent = get_gpu_info()
    
    return HardwareMetric(
        cpu_percent=cpu_percent,
        memory_percent=memory_percent,
        memory_used_mb=memory_used_mb,
        memory_total_mb=memory_total_mb,
        disk_percent=disk_percent,
        disk_free_gb=disk_free_gb,
        gpu_name=gpu_name,
        gpu_percent=gpu_percent,
        network_sent_kb=net_sent_kb,
        network_recv_kb=net_recv_kb,
        os_name=f"{platform.system()} {platform.release()}",
        os_version=platform.version()
    )
