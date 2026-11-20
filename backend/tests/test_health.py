def test_health_check_endpoint(client):
    """Health check endpoint should be accessible without session token for readiness probes."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "uptime_seconds" in data
