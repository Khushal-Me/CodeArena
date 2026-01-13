-- CodeArena Seed Data
-- 20+ Problems with Test Cases

-- Clear existing data
TRUNCATE problems CASCADE;

-- ============================================
-- EASY Problems (7 problems)
-- ============================================

-- Problem 1: Two Sum
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, hints, tags, solution_template)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Two Sum',
    'two-sum',
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
    'easy',
    '[{"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."}, {"input": "nums = [3,2,4], target = 6", "output": "[1,2]", "explanation": "nums[1] + nums[2] == 6"}]',
    ARRAY['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
    ARRAY['A brute force approach would be to check all pairs.', 'Can you use a hash map to optimize?'],
    ARRAY['array', 'hash-table'],
    '{"python": "def two_sum(nums, target):\n    # Your code here\n    pass", "javascript": "function twoSum(nums, target) {\n    // Your code here\n}", "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[]{};\n    }\n}", "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Your code here\n        return {};\n    }\n};"}'
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '{"nums": [2,7,11,15], "target": 9}', '[0,1]', true, 0),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '{"nums": [3,2,4], "target": 6}', '[1,2]', true, 1),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '{"nums": [3,3], "target": 6}', '[0,1]', false, 2),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '{"nums": [1,2,3,4,5], "target": 9}', '[3,4]', false, 3),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '{"nums": [-1,-2,-3,-4,-5], "target": -8}', '[2,4]', false, 4);

-- Problem 2: Palindrome Number
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    'Palindrome Number',
    'palindrome-number',
    'Given an integer x, return true if x is a palindrome, and false otherwise. An integer is a palindrome when it reads the same backward as forward.',
    'easy',
    '[{"input": "x = 121", "output": "true", "explanation": "121 reads as 121 from left to right and from right to left."}, {"input": "x = -121", "output": "false", "explanation": "From left to right, it reads -121. From right to left, it becomes 121-."}, {"input": "x = 10", "output": "false"}]',
    ARRAY['-2^31 <= x <= 2^31 - 1'],
    ARRAY['number', 'math']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('b2c3d4e5-f6a7-8901-bcde-f23456789012', '{"x": 121}', 'true', true, 0),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', '{"x": -121}', 'false', true, 1),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', '{"x": 10}', 'false', true, 2),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', '{"x": 12321}', 'true', false, 3),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', '{"x": 0}', 'true', false, 4);

-- Problem 3: FizzBuzz
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'c3d4e5f6-a7b8-9012-cdef-345678901234',
    'FizzBuzz',
    'fizzbuzz',
    'Given an integer n, return a string array answer (1-indexed) where: answer[i] == "FizzBuzz" if i is divisible by 3 and 5, answer[i] == "Fizz" if i is divisible by 3, answer[i] == "Buzz" if i is divisible by 5, answer[i] == i (as a string) if none of the above conditions are true.',
    'easy',
    '[{"input": "n = 3", "output": "[\"1\",\"2\",\"Fizz\"]"}, {"input": "n = 5", "output": "[\"1\",\"2\",\"Fizz\",\"4\",\"Buzz\"]"}, {"input": "n = 15", "output": "[\"1\",\"2\",\"Fizz\",\"4\",\"Buzz\",\"Fizz\",\"7\",\"8\",\"Fizz\",\"Buzz\",\"11\",\"Fizz\",\"13\",\"14\",\"FizzBuzz\"]"}]',
    ARRAY['1 <= n <= 10^4'],
    ARRAY['string', 'simulation']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('c3d4e5f6-a7b8-9012-cdef-345678901234', '{"n": 3}', '["1","2","Fizz"]', true, 0),
('c3d4e5f6-a7b8-9012-cdef-345678901234', '{"n": 5}', '["1","2","Fizz","4","Buzz"]', true, 1),
('c3d4e5f6-a7b8-9012-cdef-345678901234', '{"n": 15}', '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', true, 2),
('c3d4e5f6-a7b8-9012-cdef-345678901234', '{"n": 1}', '["1"]', false, 3);

-- Problem 4: Reverse String
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'd4e5f6a7-b8c9-0123-def0-456789012345',
    'Reverse String',
    'reverse-string',
    'Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory.',
    'easy',
    '[{"input": "s = [\"h\",\"e\",\"l\",\"l\",\"o\"]", "output": "[\"o\",\"l\",\"l\",\"e\",\"h\"]"}, {"input": "s = [\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]", "output": "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]"}]',
    ARRAY['1 <= s.length <= 10^5', 's[i] is a printable ascii character.'],
    ARRAY['string', 'two-pointers']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('d4e5f6a7-b8c9-0123-def0-456789012345', '{"s": ["h","e","l","l","o"]}', '["o","l","l","e","h"]', true, 0),
('d4e5f6a7-b8c9-0123-def0-456789012345', '{"s": ["H","a","n","n","a","h"]}', '["h","a","n","n","a","H"]', true, 1),
('d4e5f6a7-b8c9-0123-def0-456789012345', '{"s": ["a"]}', '["a"]', false, 2),
('d4e5f6a7-b8c9-0123-def0-456789012345', '{"s": ["a","b"]}', '["b","a"]', false, 3);

-- Problem 5: Valid Parentheses
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'e5f6a7b8-c9d0-1234-ef01-567890123456',
    'Valid Parentheses',
    'valid-parentheses',
    'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets. Open brackets must be closed in the correct order. Every close bracket has a corresponding open bracket of the same type.',
    'easy',
    '[{"input": "s = \"()\"", "output": "true"}, {"input": "s = \"()[]{}\"", "output": "true"}, {"input": "s = \"(]\"", "output": "false"}]',
    ARRAY['1 <= s.length <= 10^4', 's consists of parentheses only ''()[]{}'''],
    ARRAY['string', 'stack']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('e5f6a7b8-c9d0-1234-ef01-567890123456', '{"s": "()"}', 'true', true, 0),
('e5f6a7b8-c9d0-1234-ef01-567890123456', '{"s": "()[]{}"}', 'true', true, 1),
('e5f6a7b8-c9d0-1234-ef01-567890123456', '{"s": "(]"}', 'false', true, 2),
('e5f6a7b8-c9d0-1234-ef01-567890123456', '{"s": "([)]"}', 'false', false, 3),
('e5f6a7b8-c9d0-1234-ef01-567890123456', '{"s": "{[]}"}', 'true', false, 4);

-- Problem 6: Maximum Subarray
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'f6a7b8c9-d0e1-2345-f012-678901234567',
    'Maximum Subarray',
    'maximum-subarray',
    'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
    'easy',
    '[{"input": "nums = [-2,1,-3,4,-1,2,1,-5,4]", "output": "6", "explanation": "The subarray [4,-1,2,1] has the largest sum 6."}, {"input": "nums = [1]", "output": "1", "explanation": "The subarray [1] has the largest sum 1."}, {"input": "nums = [5,4,-1,7,8]", "output": "23", "explanation": "The subarray [5,4,-1,7,8] has the largest sum 23."}]',
    ARRAY['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    ARRAY['array', 'dynamic-programming', 'divide-and-conquer']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('f6a7b8c9-d0e1-2345-f012-678901234567', '{"nums": [-2,1,-3,4,-1,2,1,-5,4]}', '6', true, 0),
('f6a7b8c9-d0e1-2345-f012-678901234567', '{"nums": [1]}', '1', true, 1),
('f6a7b8c9-d0e1-2345-f012-678901234567', '{"nums": [5,4,-1,7,8]}', '23', true, 2),
('f6a7b8c9-d0e1-2345-f012-678901234567', '{"nums": [-1]}', '-1', false, 3);

-- Problem 7: Contains Duplicate
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'a7b8c9d0-e1f2-3456-0123-789012345678',
    'Contains Duplicate',
    'contains-duplicate',
    'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.',
    'easy',
    '[{"input": "nums = [1,2,3,1]", "output": "true"}, {"input": "nums = [1,2,3,4]", "output": "false"}, {"input": "nums = [1,1,1,3,3,4,3,2,4,2]", "output": "true"}]',
    ARRAY['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    ARRAY['array', 'hash-table', 'sorting']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('a7b8c9d0-e1f2-3456-0123-789012345678', '{"nums": [1,2,3,1]}', 'true', true, 0),
('a7b8c9d0-e1f2-3456-0123-789012345678', '{"nums": [1,2,3,4]}', 'false', true, 1),
('a7b8c9d0-e1f2-3456-0123-789012345678', '{"nums": [1,1,1,3,3,4,3,2,4,2]}', 'true', true, 2),
('a7b8c9d0-e1f2-3456-0123-789012345678', '{"nums": [1]}', 'false', false, 3);

-- ============================================
-- MEDIUM Problems (8 problems)
-- ============================================

-- Problem 8: Add Two Numbers (Linked List)
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'b8c9d0e1-f2a3-4567-1234-890123456789',
    'Add Two Numbers',
    'add-two-numbers',
    'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.',
    'medium',
    '[{"input": "l1 = [2,4,3], l2 = [5,6,4]", "output": "[7,0,8]", "explanation": "342 + 465 = 807."}, {"input": "l1 = [0], l2 = [0]", "output": "[0]"}, {"input": "l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]", "output": "[8,9,9,9,0,0,0,1]"}]',
    ARRAY['The number of nodes in each linked list is in the range [1, 100].', '0 <= Node.val <= 9', 'It is guaranteed that the list represents a number that does not have leading zeros.'],
    ARRAY['linked-list', 'math', 'recursion']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('b8c9d0e1-f2a3-4567-1234-890123456789', '{"l1": [2,4,3], "l2": [5,6,4]}', '[7,0,8]', true, 0),
('b8c9d0e1-f2a3-4567-1234-890123456789', '{"l1": [0], "l2": [0]}', '[0]', true, 1),
('b8c9d0e1-f2a3-4567-1234-890123456789', '{"l1": [9,9,9,9,9,9,9], "l2": [9,9,9,9]}', '[8,9,9,9,0,0,0,1]', true, 2);

-- Problem 9: Longest Substring Without Repeating Characters
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'c9d0e1f2-a3b4-5678-2345-901234567890',
    'Longest Substring Without Repeating Characters',
    'longest-substring-without-repeating-characters',
    'Given a string s, find the length of the longest substring without repeating characters.',
    'medium',
    '[{"input": "s = \"abcabcbb\"", "output": "3", "explanation": "The answer is \"abc\", with the length of 3."}, {"input": "s = \"bbbbb\"", "output": "1", "explanation": "The answer is \"b\", with the length of 1."}, {"input": "s = \"pwwkew\"", "output": "3", "explanation": "The answer is \"wke\", with the length of 3."}]',
    ARRAY['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
    ARRAY['hash-table', 'string', 'sliding-window']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('c9d0e1f2-a3b4-5678-2345-901234567890', '{"s": "abcabcbb"}', '3', true, 0),
('c9d0e1f2-a3b4-5678-2345-901234567890', '{"s": "bbbbb"}', '1', true, 1),
('c9d0e1f2-a3b4-5678-2345-901234567890', '{"s": "pwwkew"}', '3', true, 2),
('c9d0e1f2-a3b4-5678-2345-901234567890', '{"s": ""}', '0', false, 3);

-- Problem 10: 3Sum
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'd0e1f2a3-b4c5-6789-3456-012345678901',
    '3Sum',
    '3sum',
    'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. Notice that the solution set must not contain duplicate triplets.',
    'medium',
    '[{"input": "nums = [-1,0,1,2,-1,-4]", "output": "[[-1,-1,2],[-1,0,1]]", "explanation": "nums[0] + nums[1] + nums[2] = -1 + 0 + 1 = 0. nums[1] + nums[2] + nums[4] = 0 + 1 + -1 = 0. nums[0] + nums[3] + nums[4] = -1 + 2 + -1 = 0."}, {"input": "nums = [0,1,1]", "output": "[]"}, {"input": "nums = [0,0,0]", "output": "[[0,0,0]]"}]',
    ARRAY['3 <= nums.length <= 3000', '-10^5 <= nums[i] <= 10^5'],
    ARRAY['array', 'two-pointers', 'sorting']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('d0e1f2a3-b4c5-6789-3456-012345678901', '{"nums": [-1,0,1,2,-1,-4]}', '[[-1,-1,2],[-1,0,1]]', true, 0),
('d0e1f2a3-b4c5-6789-3456-012345678901', '{"nums": [0,1,1]}', '[]', true, 1),
('d0e1f2a3-b4c5-6789-3456-012345678901', '{"nums": [0,0,0]}', '[[0,0,0]]', true, 2);

-- Problem 11: Group Anagrams
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'e1f2a3b4-c5d6-7890-4567-123456789012',
    'Group Anagrams',
    'group-anagrams',
    'Given an array of strings strs, group the anagrams together. You can return the answer in any order. An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.',
    'medium',
    '[{"input": "strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]", "output": "[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]"}, {"input": "strs = [\"\"]", "output": "[[\"\"]]"}, {"input": "strs = [\"a\"]", "output": "[[\"a\"]]"}]',
    ARRAY['1 <= strs.length <= 10^4', '0 <= strs[i].length <= 100', 'strs[i] consists of lowercase English letters.'],
    ARRAY['array', 'hash-table', 'string', 'sorting']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('e1f2a3b4-c5d6-7890-4567-123456789012', '{"strs": ["eat","tea","tan","ate","nat","bat"]}', '[["bat"],["nat","tan"],["ate","eat","tea"]]', true, 0),
('e1f2a3b4-c5d6-7890-4567-123456789012', '{"strs": [""]}', '[[""]]', true, 1),
('e1f2a3b4-c5d6-7890-4567-123456789012', '{"strs": ["a"]}', '[["a"]]', true, 2);

-- Problem 12: Product of Array Except Self
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'f2a3b4c5-d6e7-8901-5678-234567890123',
    'Product of Array Except Self',
    'product-of-array-except-self',
    'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer. You must write an algorithm that runs in O(n) time and without using the division operation.',
    'medium',
    '[{"input": "nums = [1,2,3,4]", "output": "[24,12,8,6]"}, {"input": "nums = [-1,1,0,-3,3]", "output": "[0,0,9,0,0]"}]',
    ARRAY['2 <= nums.length <= 10^5', '-30 <= nums[i] <= 30', 'The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.'],
    ARRAY['array', 'prefix-sum']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('f2a3b4c5-d6e7-8901-5678-234567890123', '{"nums": [1,2,3,4]}', '[24,12,8,6]', true, 0),
('f2a3b4c5-d6e7-8901-5678-234567890123', '{"nums": [-1,1,0,-3,3]}', '[0,0,9,0,0]', true, 1);

-- Problem 13: Merge Intervals
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'a3b4c5d6-e7f8-9012-6789-345678901234',
    'Merge Intervals',
    'merge-intervals',
    'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    'medium',
    '[{"input": "intervals = [[1,3],[2,6],[8,10],[15,18]]", "output": "[[1,6],[8,10],[15,18]]", "explanation": "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]."}, {"input": "intervals = [[1,4],[4,5]]", "output": "[[1,5]]", "explanation": "Intervals [1,4] and [4,5] are considered overlapping."}]',
    ARRAY['1 <= intervals.length <= 10^4', 'intervals[i].length == 2', '0 <= starti <= endi <= 10^4'],
    ARRAY['array', 'sorting']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('a3b4c5d6-e7f8-9012-6789-345678901234', '{"intervals": [[1,3],[2,6],[8,10],[15,18]]}', '[[1,6],[8,10],[15,18]]', true, 0),
('a3b4c5d6-e7f8-9012-6789-345678901234', '{"intervals": [[1,4],[4,5]]}', '[[1,5]]', true, 1);

-- Problem 14: Coin Change
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'b4c5d6e7-f8a9-0123-7890-456789012345',
    'Coin Change',
    'coin-change',
    'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1. You may assume that you have an infinite number of each kind of coin.',
    'medium',
    '[{"input": "coins = [1,2,5], amount = 11", "output": "3", "explanation": "11 = 5 + 5 + 1"}, {"input": "coins = [2], amount = 3", "output": "-1"}, {"input": "coins = [1], amount = 0", "output": "0"}]',
    ARRAY['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
    ARRAY['array', 'dynamic-programming', 'bfs']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('b4c5d6e7-f8a9-0123-7890-456789012345', '{"coins": [1,2,5], "amount": 11}', '3', true, 0),
('b4c5d6e7-f8a9-0123-7890-456789012345', '{"coins": [2], "amount": 3}', '-1', true, 1),
('b4c5d6e7-f8a9-0123-7890-456789012345', '{"coins": [1], "amount": 0}', '0', true, 2);

-- Problem 15: LRU Cache
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'c5d6e7f8-a9b0-1234-8901-567890123456',
    'LRU Cache',
    'lru-cache',
    'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement the LRUCache class: LRUCache(int capacity) Initialize the LRU cache with positive size capacity. int get(int key) Return the value of the key if the key exists, otherwise return -1. void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.',
    'medium',
    '[{"input": "[\"LRUCache\",\"put\",\"put\",\"get\",\"put\",\"get\",\"put\",\"get\",\"get\",\"get\"]\\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]", "output": "[null,null,null,1,null,-1,null,-1,3,4]"}]',
    ARRAY['1 <= capacity <= 3000', '0 <= key <= 10^4', '0 <= value <= 10^5', 'At most 2 * 10^5 calls will be made to get and put.'],
    ARRAY['hash-table', 'linked-list', 'design', 'doubly-linked-list']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('c5d6e7f8-a9b0-1234-8901-567890123456', '{"operations": ["LRUCache","put","put","get","put","get","put","get","get","get"], "args": [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]}', '[null,null,null,1,null,-1,null,-1,3,4]', true, 0);

-- ============================================
-- HARD Problems (6 problems)
-- ============================================

-- Problem 16: Median of Two Sorted Arrays
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'd6e7f8a9-b0c1-2345-9012-678901234567',
    'Median of Two Sorted Arrays',
    'median-of-two-sorted-arrays',
    'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).',
    'hard',
    '[{"input": "nums1 = [1,3], nums2 = [2]", "output": "2.00000", "explanation": "merged array = [1,2,3] and median is 2."}, {"input": "nums1 = [1,2], nums2 = [3,4]", "output": "2.50000", "explanation": "merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5."}]',
    ARRAY['nums1.length == m', 'nums2.length == n', '0 <= m <= 1000', '0 <= n <= 1000', '1 <= m + n <= 2000', '-10^6 <= nums1[i], nums2[i] <= 10^6'],
    ARRAY['array', 'binary-search', 'divide-and-conquer']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('d6e7f8a9-b0c1-2345-9012-678901234567', '{"nums1": [1,3], "nums2": [2]}', '2.0', true, 0),
('d6e7f8a9-b0c1-2345-9012-678901234567', '{"nums1": [1,2], "nums2": [3,4]}', '2.5', true, 1);

-- Problem 17: Regular Expression Matching
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'e7f8a9b0-c1d2-3456-0123-789012345678',
    'Regular Expression Matching',
    'regular-expression-matching',
    'Given an input string s and a pattern p, implement regular expression matching with support for ''.'' and ''*'' where: ''.'' Matches any single character.​​​​ ''*'' Matches zero or more of the preceding element. The matching should cover the entire input string (not partial).',
    'hard',
    '[{"input": "s = \"aa\", p = \"a\"", "output": "false", "explanation": "\"a\" does not match the entire string \"aa\"."}, {"input": "s = \"aa\", p = \"a*\"", "output": "true", "explanation": "''*'' means zero or more of the preceding element, ''a''. Therefore, by repeating ''a'' once, it becomes \"aa\"."}, {"input": "s = \"ab\", p = \".*\"", "output": "true", "explanation": "\".*\" means \"zero or more (*) of any character (.)\"."}]',
    ARRAY['1 <= s.length <= 20', '1 <= p.length <= 20', 's contains only lowercase English letters.', 'p contains only lowercase English letters, ''.'', and ''*''.', 'It is guaranteed for each appearance of the character ''*'', there will be a previous valid character to match.'],
    ARRAY['string', 'dynamic-programming', 'recursion']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('e7f8a9b0-c1d2-3456-0123-789012345678', '{"s": "aa", "p": "a"}', 'false', true, 0),
('e7f8a9b0-c1d2-3456-0123-789012345678', '{"s": "aa", "p": "a*"}', 'true', true, 1),
('e7f8a9b0-c1d2-3456-0123-789012345678', '{"s": "ab", "p": ".*"}', 'true', true, 2);

-- Problem 18: Merge k Sorted Lists
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'f8a9b0c1-d2e3-4567-1234-890123456789',
    'Merge k Sorted Lists',
    'merge-k-sorted-lists',
    'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
    'hard',
    '[{"input": "lists = [[1,4,5],[1,3,4],[2,6]]", "output": "[1,1,2,3,4,4,5,6]", "explanation": "The linked-lists are: [1->4->5, 1->3->4, 2->6]. Merging them into one sorted list: 1->1->2->3->4->4->5->6"}, {"input": "lists = []", "output": "[]"}, {"input": "lists = [[]]", "output": "[]"}]',
    ARRAY['k == lists.length', '0 <= k <= 10^4', '0 <= lists[i].length <= 500', '-10^4 <= lists[i][j] <= 10^4', 'lists[i] is sorted in ascending order.', 'The sum of lists[i].length will not exceed 10^4.'],
    ARRAY['linked-list', 'divide-and-conquer', 'heap', 'merge-sort']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('f8a9b0c1-d2e3-4567-1234-890123456789', '{"lists": [[1,4,5],[1,3,4],[2,6]]}', '[1,1,2,3,4,4,5,6]', true, 0),
('f8a9b0c1-d2e3-4567-1234-890123456789', '{"lists": []}', '[]', true, 1),
('f8a9b0c1-d2e3-4567-1234-890123456789', '{"lists": [[]]}', '[]', true, 2);

-- Problem 19: Trapping Rain Water
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'a9b0c1d2-e3f4-5678-2345-901234567890',
    'Trapping Rain Water',
    'trapping-rain-water',
    'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    'hard',
    '[{"input": "height = [0,1,0,2,1,0,1,3,2,1,2,1]", "output": "6", "explanation": "The elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped."}, {"input": "height = [4,2,0,3,2,5]", "output": "9"}]',
    ARRAY['n == height.length', '1 <= n <= 2 * 10^4', '0 <= height[i] <= 10^5'],
    ARRAY['array', 'two-pointers', 'dynamic-programming', 'stack', 'monotonic-stack']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('a9b0c1d2-e3f4-5678-2345-901234567890', '{"height": [0,1,0,2,1,0,1,3,2,1,2,1]}', '6', true, 0),
('a9b0c1d2-e3f4-5678-2345-901234567890', '{"height": [4,2,0,3,2,5]}', '9', true, 1);

-- Problem 20: Word Ladder
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'b0c1d2e3-f4a5-6789-3456-012345678901',
    'Word Ladder',
    'word-ladder',
    'A transformation sequence from word beginWord to word endWord using a dictionary wordList is a sequence of words beginWord -> s1 -> s2 -> ... -> sk such that: Every adjacent pair of words differs by a single letter. Every si for 1 <= i <= k is in wordList. Note that beginWord does not need to be in wordList. sk == endWord. Given two words, beginWord and endWord, and a dictionary wordList, return the number of words in the shortest transformation sequence from beginWord to endWord, or 0 if no such sequence exists.',
    'hard',
    '[{"input": "beginWord = \"hit\", endWord = \"cog\", wordList = [\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]", "output": "5", "explanation": "One shortest transformation sequence is \"hit\" -> \"hot\" -> \"dot\" -> \"dog\" -> \"cog\", which is 5 words long."}, {"input": "beginWord = \"hit\", endWord = \"cog\", wordList = [\"hot\",\"dot\",\"dog\",\"lot\",\"log\"]", "output": "0", "explanation": "The endWord \"cog\" is not in wordList, therefore there is no valid transformation sequence."}]',
    ARRAY['1 <= beginWord.length <= 10', 'endWord.length == beginWord.length', '1 <= wordList.length <= 5000', 'wordList[i].length == beginWord.length', 'beginWord, endWord, and wordList[i] consist of lowercase English letters.', 'beginWord != endWord', 'All the words in wordList are unique.'],
    ARRAY['hash-table', 'string', 'bfs']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('b0c1d2e3-f4a5-6789-3456-012345678901', '{"beginWord": "hit", "endWord": "cog", "wordList": ["hot","dot","dog","lot","log","cog"]}', '5', true, 0),
('b0c1d2e3-f4a5-6789-3456-012345678901', '{"beginWord": "hit", "endWord": "cog", "wordList": ["hot","dot","dog","lot","log"]}', '0', true, 1);

-- Problem 21: Serialize and Deserialize Binary Tree
INSERT INTO problems (id, title, slug, description, difficulty, examples, constraints, tags)
VALUES (
    'c1d2e3f4-a5b6-7890-4567-123456789012',
    'Serialize and Deserialize Binary Tree',
    'serialize-and-deserialize-binary-tree',
    'Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer, or transmitted across a network connection link to be reconstructed later in the same or another computer environment. Design an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work. You just need to ensure that a binary tree can be serialized to a string and this string can be deserialized to the original tree structure.',
    'hard',
    '[{"input": "root = [1,2,3,null,null,4,5]", "output": "[1,2,3,null,null,4,5]"}, {"input": "root = []", "output": "[]"}, {"input": "root = [1]", "output": "[1]"}]',
    ARRAY['The number of nodes in the tree is in the range [0, 10^4].', '-1000 <= Node.val <= 1000'],
    ARRAY['string', 'tree', 'design', 'binary-tree', 'dfs', 'bfs']
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
('c1d2e3f4-a5b6-7890-4567-123456789012', '{"root": [1,2,3,null,null,4,5]}', '[1,2,3,null,null,4,5]', true, 0),
('c1d2e3f4-a5b6-7890-4567-123456789012', '{"root": []}', '[]', true, 1),
('c1d2e3f4-a5b6-7890-4567-123456789012', '{"root": [1]}', '[1]', true, 2);

-- Verify data
SELECT 
    difficulty,
    COUNT(*) as problem_count
FROM problems 
GROUP BY difficulty
ORDER BY 
    CASE difficulty 
        WHEN 'easy' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'hard' THEN 3 
    END;

SELECT 
    'Total Problems' as metric,
    COUNT(*)::TEXT as value
FROM problems
UNION ALL
SELECT 
    'Total Test Cases',
    COUNT(*)::TEXT
FROM test_cases;
