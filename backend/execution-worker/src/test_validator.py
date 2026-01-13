"""Test case validation utilities."""

from typing import List, Optional
from dataclasses import dataclass


@dataclass
class ValidationResult:
    """Result of validating output against expected."""
    is_valid: bool
    message: Optional[str] = None
    actual: Optional[str] = None
    expected: Optional[str] = None


def normalize_whitespace(text: str) -> str:
    """Normalize whitespace in text for comparison."""
    # Remove trailing whitespace from each line
    lines = text.strip().split('\n')
    normalized_lines = [line.rstrip() for line in lines]
    # Remove empty trailing lines
    while normalized_lines and not normalized_lines[-1]:
        normalized_lines.pop()
    return '\n'.join(normalized_lines)


def validate_output(actual: str, expected: str, strict: bool = False) -> ValidationResult:
    """
    Validate actual output against expected output.
    
    Args:
        actual: The actual output from code execution
        expected: The expected output
        strict: If True, require exact match. If False, allow whitespace differences.
    
    Returns:
        ValidationResult with validation status and details
    """
    if strict:
        is_valid = actual == expected
    else:
        normalized_actual = normalize_whitespace(actual)
        normalized_expected = normalize_whitespace(expected)
        is_valid = normalized_actual == normalized_expected
    
    if is_valid:
        return ValidationResult(is_valid=True)
    
    return ValidationResult(
        is_valid=False,
        message="Output does not match expected",
        actual=actual[:500] if len(actual) > 500 else actual,  # Truncate for display
        expected=expected[:500] if len(expected) > 500 else expected
    )


def validate_test_cases(
    outputs: List[str], 
    expected_outputs: List[str],
    strict: bool = False
) -> List[ValidationResult]:
    """
    Validate multiple test case outputs.
    
    Args:
        outputs: List of actual outputs
        expected_outputs: List of expected outputs
        strict: If True, require exact matches
    
    Returns:
        List of ValidationResults
    """
    if len(outputs) != len(expected_outputs):
        raise ValueError(
            f"Mismatch: {len(outputs)} outputs vs {len(expected_outputs)} expected"
        )
    
    return [
        validate_output(actual, expected, strict)
        for actual, expected in zip(outputs, expected_outputs)
    ]


def format_diff(actual: str, expected: str, max_lines: int = 10) -> str:
    """
    Create a simple diff format for display.
    
    Args:
        actual: The actual output
        expected: The expected output
        max_lines: Maximum lines to show in diff
    
    Returns:
        Formatted diff string
    """
    actual_lines = actual.split('\n')[:max_lines]
    expected_lines = expected.split('\n')[:max_lines]
    
    diff_lines = []
    max_len = max(len(actual_lines), len(expected_lines))
    
    for i in range(max_len):
        actual_line = actual_lines[i] if i < len(actual_lines) else "<missing>"
        expected_line = expected_lines[i] if i < len(expected_lines) else "<missing>"
        
        if actual_line != expected_line:
            diff_lines.append(f"Line {i+1}:")
            diff_lines.append(f"  Expected: {expected_line!r}")
            diff_lines.append(f"  Actual:   {actual_line!r}")
    
    if len(actual_lines) > max_lines or len(expected_lines) > max_lines:
        diff_lines.append(f"... (truncated, showing first {max_lines} lines)")
    
    return '\n'.join(diff_lines)
