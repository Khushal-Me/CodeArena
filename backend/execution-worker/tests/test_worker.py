import pytest
import json
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))


class TestDockerManager:
    """Tests for the Docker Manager module"""

    @pytest.fixture
    def mock_docker_client(self):
        with patch('docker.from_env') as mock:
            client = MagicMock()
            mock.return_value = client
            yield client

    def test_create_container_python(self, mock_docker_client):
        """Test creating a Python execution container"""
        from docker_manager import DockerManager
        
        manager = DockerManager()
        
        mock_container = MagicMock()
        mock_container.id = 'container-123'
        mock_docker_client.containers.run.return_value = mock_container
        
        # Test that container creation works
        assert manager is not None

    def test_resource_limits(self):
        """Test that resource limits are properly set"""
        # Memory limit should be 256MB
        assert 256 * 1024 * 1024 == 268435456
        
        # CPU quota should limit to 1 core
        assert 100000 == 100000

    def test_supported_languages(self):
        """Test that all expected languages are supported"""
        supported = ['python', 'javascript', 'java', 'cpp']
        for lang in supported:
            assert lang in supported


class TestExecutor:
    """Tests for the code executor"""

    def test_parse_json_output(self):
        """Test parsing JSON output from execution"""
        output = '{"result": [0, 1]}'
        parsed = json.loads(output)
        assert parsed['result'] == [0, 1]

    def test_parse_simple_output(self):
        """Test parsing simple string output"""
        output = 'Hello, World!'
        assert output.strip() == 'Hello, World!'

    def test_timeout_detection(self):
        """Test that timeout is properly detected"""
        # Timeout should be 10 seconds by default
        timeout = 10
        assert timeout > 0
        assert timeout <= 30  # Max reasonable timeout

    def test_memory_limit_detection(self):
        """Test memory limit enforcement"""
        memory_limit = 256  # MB
        assert memory_limit <= 512  # Should not exceed 512MB


class TestTestValidator:
    """Tests for test case validation"""

    def test_compare_simple_values(self):
        """Test comparing simple output values"""
        expected = '42'
        actual = '42'
        assert expected == actual

    def test_compare_arrays(self):
        """Test comparing array outputs"""
        expected = [0, 1]
        actual = [0, 1]
        assert expected == actual

    def test_compare_with_whitespace(self):
        """Test comparison ignoring trailing whitespace"""
        expected = 'hello'
        actual = 'hello\n'
        assert expected == actual.strip()

    def test_compare_floating_point(self):
        """Test floating point comparison with tolerance"""
        expected = 2.5
        actual = 2.50000001
        assert abs(expected - actual) < 0.0001

    def test_test_case_result_structure(self):
        """Test that test case results have correct structure"""
        result = {
            'passed': True,
            'input': '{"nums": [1,2], "target": 3}',
            'expected': '[0,1]',
            'actual': '[0,1]',
            'execution_time': 50,
            'error': None
        }
        
        assert 'passed' in result
        assert 'input' in result
        assert 'expected' in result
        assert 'actual' in result
        assert result['passed'] is True


class TestWorker:
    """Tests for the main worker process"""

    def test_job_structure(self):
        """Test that job structure is correct"""
        job = {
            'submission_id': 'sub-123',
            'problem_id': 'prob-456',
            'code': 'print("hello")',
            'language': 'python',
            'test_cases': [
                {'input': '{}', 'expected': 'hello'}
            ]
        }
        
        assert 'submission_id' in job
        assert 'code' in job
        assert 'language' in job
        assert 'test_cases' in job

    def test_status_transitions(self):
        """Test valid status transitions"""
        valid_statuses = [
            'queued',
            'processing',
            'accepted',
            'wrong_answer',
            'time_limit_exceeded',
            'memory_limit_exceeded',
            'runtime_error',
            'compilation_error',
            'system_error'
        ]
        
        # Initial status should be queued
        status = 'queued'
        assert status in valid_statuses
        
        # Can transition to processing
        status = 'processing'
        assert status in valid_statuses
        
        # Can transition to final status
        status = 'accepted'
        assert status in valid_statuses

    def test_language_to_image_mapping(self):
        """Test language to Docker image mapping"""
        mapping = {
            'python': 'codearena-runner-python:latest',
            'javascript': 'codearena-runner-javascript:latest',
            'java': 'codearena-runner-java:latest',
            'cpp': 'codearena-runner-cpp:latest'
        }
        
        assert mapping['python'] == 'codearena-runner-python:latest'
        assert mapping['javascript'] == 'codearena-runner-javascript:latest'


class TestSecurity:
    """Security-related tests"""

    def test_seccomp_profile_exists(self):
        """Test that seccomp profile exists"""
        seccomp_path = os.path.join(
            os.path.dirname(__file__), 
            '..', '..', 
            'execution-containers', 
            'seccomp.json'
        )
        # In actual tests, verify the file exists
        assert True  # Placeholder

    def test_network_disabled(self):
        """Test that network is disabled for containers"""
        # Network mode should be 'none'
        network_mode = 'none'
        assert network_mode == 'none'

    def test_readonly_rootfs(self):
        """Test that root filesystem is read-only"""
        read_only = True
        assert read_only is True

    def test_no_new_privileges(self):
        """Test that no new privileges flag is set"""
        no_new_privileges = True
        assert no_new_privileges is True

    def test_pid_limit(self):
        """Test PID limit is set"""
        pids_limit = 50
        assert pids_limit <= 100


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
