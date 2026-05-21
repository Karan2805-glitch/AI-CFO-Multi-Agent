import pytest

def test_analyze_endpoint_no_file(client):
    response = client.post("/analyze/analyze")
    # Should return 422 Unprocessable Entity because session_id is missing
    assert response.status_code == 422

def test_session_not_found(client):
    response = client.get("/session/invalid-id")
    assert response.status_code == 404

def test_get_run_results_not_found(client):
    response = client.get("/results/nonexistent-id")
    # Assuming it returns 404 for not found
    assert response.status_code == 404
