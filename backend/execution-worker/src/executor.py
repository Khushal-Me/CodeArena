"""
CodeArena Code Executor

This module orchestrates the execution of user-submitted code against test cases.
It manages Docker containers for secure, isolated code execution.

Key Responsibilities:
- Parse and validate test case inputs
- Spawn Docker containers for code execution
- Compare actual output vs expected output
- Aggregate results across all test cases
- Determine final submission status (Accepted, Wrong Answer, etc.)

Security:
- All code runs in isolated Docker containers
- Network access disabled
- Resource limits enforced (memory, CPU, time)
- Output sanitized before storage
"""

from typing import List, Optional
from dataclasses import dataclass
from enum import Enum

from .docker_manager import DockerManager, Language, ExecutionConfig, ExecutionResult
from .logger import get_logger

logger = get_logger("executor")


class SubmissionStatus(str, Enum):
    """Possible submission statuses."""
    QUEUED = "Queued"
    RUNNING = "Running"
    ACCEPTED = "Accepted"
    WRONG_ANSWER = "Wrong Answer"
    TIME_LIMIT_EXCEEDED = "Time Limit Exceeded"
    RUNTIME_ERROR = "Runtime Error"
    COMPILATION_ERROR = "Compilation Error"


@dataclass
class TestCase:
    """A test case for validation."""
    id: int
    input: str
    expected_output: str


@dataclass
class TestCaseResult:
    """Result of running a single test case."""
    test_case_id: int
    passed: bool
    output: str
    expected_output: str
    execution_time_ms: int
    error: Optional[str] = None


@dataclass
class SubmissionResult:
    """Complete result of a submission."""
    submission_id: str
    status: SubmissionStatus
    test_results: List[TestCaseResult]
    total_execution_time_ms: int
    max_memory_used_kb: int
    stdout: str
    stderr: str
    passed_count: int
    total_count: int


class CodeExecutor:
    """Executes code against test cases and validates results."""

    def __init__(self, config: Optional[ExecutionConfig] = None):
        self.docker_manager = DockerManager(config)
        logger.info("CodeExecutor initialized")

    def _normalize_output(self, output: str) -> str:
        """Normalize output for comparison."""
        # Strip whitespace, normalize line endings
        lines = output.strip().split('\n')
        return '\n'.join(line.strip() for line in lines)

    def _compare_output(self, actual: str, expected: str) -> bool:
        """Compare actual output with expected output."""
        return self._normalize_output(actual) == self._normalize_output(expected)

    def execute_submission(
        self,
        submission_id: str,
        language: str,
        code: str,
        test_cases: List[TestCase]
    ) -> SubmissionResult:
        """Execute a submission against all test cases."""
        
        logger.info("Starting execution", 
                   submission_id=submission_id, 
                   language=language,
                   test_count=len(test_cases))
        
        try:
            lang = Language(language.lower())
        except ValueError:
            logger.error("Unsupported language", language=language)
            return SubmissionResult(
                submission_id=submission_id,
                status=SubmissionStatus.RUNTIME_ERROR,
                test_results=[],
                total_execution_time_ms=0,
                max_memory_used_kb=0,
                stdout="",
                stderr=f"Unsupported language: {language}",
                passed_count=0,
                total_count=len(test_cases)
            )
        
        test_results: List[TestCaseResult] = []
        total_execution_time_ms = 0
        max_memory_used_kb = 0
        all_stdout = []
        all_stderr = []
        
        for test_case in test_cases:
            logger.debug("Running test case", 
                        submission_id=submission_id,
                        test_case_id=test_case.id)
            
            # Execute code with test case input
            result = self.docker_manager.execute(lang, code, test_case.input)
            
            # Track metrics
            total_execution_time_ms += result.execution_time_ms
            max_memory_used_kb = max(max_memory_used_kb, result.memory_used_kb)
            
            if result.stdout:
                all_stdout.append(result.stdout)
            if result.stderr:
                all_stderr.append(result.stderr)
            
            # Check for compilation error
            if result.error == "Compilation Error":
                return SubmissionResult(
                    submission_id=submission_id,
                    status=SubmissionStatus.COMPILATION_ERROR,
                    test_results=[TestCaseResult(
                        test_case_id=test_case.id,
                        passed=False,
                        output=result.stdout,
                        expected_output=test_case.expected_output,
                        execution_time_ms=result.execution_time_ms,
                        error=result.stderr
                    )],
                    total_execution_time_ms=total_execution_time_ms,
                    max_memory_used_kb=max_memory_used_kb,
                    stdout=result.stdout,
                    stderr=result.stderr,
                    passed_count=0,
                    total_count=len(test_cases)
                )
            
            # Check for timeout
            if result.timed_out:
                test_results.append(TestCaseResult(
                    test_case_id=test_case.id,
                    passed=False,
                    output=result.stdout,
                    expected_output=test_case.expected_output,
                    execution_time_ms=result.execution_time_ms,
                    error="Time Limit Exceeded"
                ))
                return SubmissionResult(
                    submission_id=submission_id,
                    status=SubmissionStatus.TIME_LIMIT_EXCEEDED,
                    test_results=test_results,
                    total_execution_time_ms=total_execution_time_ms,
                    max_memory_used_kb=max_memory_used_kb,
                    stdout='\n'.join(all_stdout),
                    stderr='\n'.join(all_stderr),
                    passed_count=sum(1 for tr in test_results if tr.passed),
                    total_count=len(test_cases)
                )
            
            # Check for runtime error
            if not result.success and result.error != "Time Limit Exceeded":
                test_results.append(TestCaseResult(
                    test_case_id=test_case.id,
                    passed=False,
                    output=result.stdout,
                    expected_output=test_case.expected_output,
                    execution_time_ms=result.execution_time_ms,
                    error=result.stderr or "Runtime Error"
                ))
                # Continue running other test cases to show full results
                continue
            
            # Compare output
            passed = self._compare_output(result.stdout, test_case.expected_output)
            
            test_results.append(TestCaseResult(
                test_case_id=test_case.id,
                passed=passed,
                output=result.stdout,
                expected_output=test_case.expected_output,
                execution_time_ms=result.execution_time_ms,
                error=None if passed else "Wrong Answer"
            ))
        
        # Determine final status
        passed_count = sum(1 for tr in test_results if tr.passed)
        has_runtime_error = any(
            tr.error and "Runtime" in tr.error 
            for tr in test_results
        )
        
        if passed_count == len(test_cases):
            status = SubmissionStatus.ACCEPTED
        elif has_runtime_error:
            status = SubmissionStatus.RUNTIME_ERROR
        else:
            status = SubmissionStatus.WRONG_ANSWER
        
        logger.info("Execution completed",
                   submission_id=submission_id,
                   status=status.value,
                   passed=passed_count,
                   total=len(test_cases),
                   execution_time_ms=total_execution_time_ms)
        
        return SubmissionResult(
            submission_id=submission_id,
            status=status,
            test_results=test_results,
            total_execution_time_ms=total_execution_time_ms,
            max_memory_used_kb=max_memory_used_kb,
            stdout='\n'.join(all_stdout),
            stderr='\n'.join(all_stderr),
            passed_count=passed_count,
            total_count=len(test_cases)
        )

    def cleanup(self) -> None:
        """Cleanup any orphaned containers."""
        removed = self.docker_manager.cleanup_orphaned_containers()
        if removed > 0:
            logger.info("Cleaned up orphaned containers", count=removed)

    def health_check(self) -> bool:
        """Check if the executor is healthy."""
        return self.docker_manager.health_check()
