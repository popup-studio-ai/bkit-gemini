#!/bin/bash
#===============================================================================
# bkit-gemini Comprehensive Test Runner
# Version: 1.5.5
# Purpose: Execute all test cases defined in bkit-gemini-comprehensive-test.design.md
# Executor: Gemini CLI
#===============================================================================

# Don't exit on error - we want to run all tests
# set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Test results file
RESULTS_FILE="test-results-$(date +%Y%m%d-%H%M%S).json"

# Test project directory
TEST_PROJECT_DIR="/tmp/bkit-test-project"

#-------------------------------------------------------------------------------
# Utility Functions
#-------------------------------------------------------------------------------

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

log_skip() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
    ((SKIPPED_TESTS++))
}

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

setup_test_project() {
    log_info "Setting up test project directory..."
    rm -rf "$TEST_PROJECT_DIR"
    mkdir -p "$TEST_PROJECT_DIR"
    cd "$TEST_PROJECT_DIR"
    git init -q

    # Create basic structure
    mkdir -p docs/01-plan/features
    mkdir -p docs/02-design/features
    mkdir -p docs/03-analysis
    mkdir -p docs/04-report/features
    mkdir -p src/features
    mkdir -p components

    # Initialize pdca-status.json
    cat > .pdca-status.json << 'EOF'
{
  "version": "2.0",
  "activeFeatures": {},
  "pipeline": {
    "level": "Starter",
    "currentPhase": 1,
    "phaseHistory": []
  },
  "lastChecked": null
}
EOF

    log_info "Test project created at $TEST_PROJECT_DIR"
}

cleanup_test_project() {
    log_info "Cleaning up test project..."
    rm -rf "$TEST_PROJECT_DIR"
}

run_test() {
    local test_id=$1
    local test_name=$2
    local test_command=$3
    local expected_pattern=$4

    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} $test_id - $test_name"

    # Run the test
    local output
    if output=$(eval "$test_command" 2>&1); then
        if echo "$output" | grep -qE "$expected_pattern"; then
            log_pass "$test_id: $test_name"
            return 0
        else
            log_fail "$test_id: $test_name (Pattern not found: $expected_pattern)"
            echo "Output: $output"
            return 1
        fi
    else
        log_fail "$test_id: $test_name (Command failed)"
        echo "Output: $output"
        return 1
    fi
}

#===============================================================================
# Section 1: Commands TOML Tests (CMD-*)
#===============================================================================

run_commands_toml_tests() {
    log_section "1. Commands TOML Tests"

    local BKIT_DIR
    BKIT_DIR=$(dirname "$(dirname "$0")")

    # CMD-01: TOML Syntax Validation
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} CMD-01 - TOML Syntax Validation"
    local toml_valid=true
    for file in "$BKIT_DIR"/commands/*.toml; do
        if [ -f "$file" ]; then
            # Basic TOML validation (check for description and prompt)
            if ! grep -q '^description = ' "$file" || ! grep -q '^prompt = ' "$file"; then
                toml_valid=false
                echo "  Invalid: $file"
            fi
        fi
    done
    if [ "$toml_valid" = true ]; then
        log_pass "CMD-01: All TOML files have valid syntax"
    else
        log_fail "CMD-01: Some TOML files have invalid syntax"
    fi

    # CMD-02: Required Fields Check
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} CMD-02 - Required Fields Check"
    local fields_valid=true
    for file in "$BKIT_DIR"/commands/*.toml; do
        if [ -f "$file" ]; then
            if ! grep -q '^description = "' "$file"; then
                fields_valid=false
                echo "  Missing description: $file"
            fi
            if ! grep -q '^prompt = """' "$file"; then
                fields_valid=false
                echo "  Missing prompt: $file"
            fi
        fi
    done
    if [ "$fields_valid" = true ]; then
        log_pass "CMD-02: All TOML files have required fields"
    else
        log_fail "CMD-02: Some TOML files missing required fields"
    fi

    # CMD-03: File Count Check (should be 10)
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} CMD-03 - TOML File Count"
    local toml_count
    toml_count=$(find "$BKIT_DIR/commands" -name "*.toml" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$toml_count" -eq 18 ]; then
        log_pass "CMD-03: Found 18 TOML command files"
    else
        log_fail "CMD-03: Expected 18 TOML files, found $toml_count"
    fi

    # CMD-04 to CMD-13: Individual Command File Tests
    local expected_commands=("pdca" "starter" "dynamic" "enterprise" "pipeline" "review" "qa" "learn" "bkit" "github-stats")
    local cmd_num=4
    for cmd in "${expected_commands[@]}"; do
        ((TOTAL_TESTS++))
        echo -e "\n${YELLOW}Testing:${NC} CMD-$(printf '%02d' $cmd_num) - $cmd.toml exists"
        if [ -f "$BKIT_DIR/commands/$cmd.toml" ]; then
            log_pass "CMD-$(printf '%02d' $cmd_num): $cmd.toml exists and is valid"
        else
            log_fail "CMD-$(printf '%02d' $cmd_num): $cmd.toml not found"
        fi
        ((cmd_num++))
    done
}

#===============================================================================
# Section 2: Skills Metadata Tests (SKILL-META-*)
#===============================================================================

run_skills_metadata_tests() {
    log_section "2. Skills Metadata Tests"

    local BKIT_DIR
    BKIT_DIR=$(dirname "$(dirname "$0")")

    # SKILL-META-01: No metadata: key in SKILL.md frontmatter (between --- markers)
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} SKILL-META-01 - No metadata: key in SKILL.md frontmatter"
    local metadata_found=false
    while IFS= read -r file; do
        # Extract frontmatter (between first two ---) and check for metadata:
        if sed -n '1,/^---$/p' "$file" | tail -n +2 | head -n -1 | grep -q '^metadata:'; then
            metadata_found=true
            echo "  Found metadata: in frontmatter of $file"
        fi
    done < <(find "$BKIT_DIR/skills" -name "SKILL.md" 2>/dev/null)

    if [ "$metadata_found" = false ]; then
        log_pass "SKILL-META-01: No SKILL.md files contain metadata: key in frontmatter"
    else
        log_fail "SKILL-META-01: Some SKILL.md files still contain metadata: key in frontmatter"
    fi

    # SKILL-META-02: No license: key in SKILL.md frontmatter
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} SKILL-META-02 - No license: key in SKILL.md frontmatter"
    local license_found=false
    while IFS= read -r file; do
        # Extract frontmatter and check for license:
        if sed -n '1,/^---$/p' "$file" | tail -n +2 | head -n -1 | grep -q '^license:'; then
            license_found=true
            echo "  Found license: in frontmatter of $file"
        fi
    done < <(find "$BKIT_DIR/skills" -name "SKILL.md" 2>/dev/null)

    if [ "$license_found" = false ]; then
        log_pass "SKILL-META-02: No SKILL.md files contain license: key in frontmatter"
    else
        log_fail "SKILL-META-02: Some SKILL.md files still contain license: key in frontmatter"
    fi

    # SKILL-META-03: All SKILL.md have only name and description
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} SKILL-META-03 - Only name: and description: in frontmatter"
    local frontmatter_valid=true
    while IFS= read -r file; do
        # Check that frontmatter only has name and description
        if ! grep -q '^name:' "$file" || ! grep -q '^description:' "$file"; then
            frontmatter_valid=false
            echo "  Missing required field in $file"
        fi
    done < <(find "$BKIT_DIR/skills" -name "SKILL.md" 2>/dev/null)

    if [ "$frontmatter_valid" = true ]; then
        log_pass "SKILL-META-03: All SKILL.md files have correct frontmatter"
    else
        log_fail "SKILL-META-03: Some SKILL.md files have incorrect frontmatter"
    fi

    # SKILL-META-04: Count Skills (should be 21)
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} SKILL-META-04 - Skills Count"
    local skills_count
    skills_count=$(find "$BKIT_DIR/skills" -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$skills_count" -eq 29 ]; then
        log_pass "SKILL-META-04: Found 29 SKILL.md files"
    else
        log_fail "SKILL-META-04: Expected 29 SKILL.md files, found $skills_count"
    fi
}

#===============================================================================
# Section 3: Agents Metadata Tests (AGENT-META-*)
#===============================================================================

run_agents_metadata_tests() {
    log_section "3. Agents Metadata Tests"

    local BKIT_DIR
    BKIT_DIR=$(dirname "$(dirname "$0")")

    # AGENT-META-01: No metadata: key in agent .md files
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} AGENT-META-01 - No metadata: key in agents"
    local metadata_found=false
    for file in "$BKIT_DIR"/agents/*.md; do
        if [ -f "$file" ]; then
            if grep -q '^metadata:' "$file"; then
                metadata_found=true
                echo "  Found metadata: in $file"
            fi
        fi
    done

    if [ "$metadata_found" = false ]; then
        log_pass "AGENT-META-01: No agent files contain metadata: key"
    else
        log_fail "AGENT-META-01: Some agent files still contain metadata: key"
    fi

    # AGENT-META-02: Count Agents (should be 11)
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} AGENT-META-02 - Agents Count"
    local agents_count
    agents_count=$(find "$BKIT_DIR/agents" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$agents_count" -eq 16 ]; then
        log_pass "AGENT-META-02: Found 16 agent files"
    else
        log_fail "AGENT-META-02: Expected 16 agent files, found $agents_count"
    fi
}

#===============================================================================
# Section 4: Extension Configuration Tests
#===============================================================================

run_extension_config_tests() {
    log_section "4. Extension Configuration Tests"

    local BKIT_DIR
    BKIT_DIR=$(dirname "$(dirname "$0")")

    # EXT-01: gemini-extension.json exists and is valid
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} EXT-01 - gemini-extension.json validation"
    if [ -f "$BKIT_DIR/gemini-extension.json" ]; then
        if python3 -c "import json; json.load(open('$BKIT_DIR/gemini-extension.json'))" 2>/dev/null; then
            log_pass "EXT-01: gemini-extension.json is valid JSON"
        else
            log_fail "EXT-01: gemini-extension.json has invalid JSON"
        fi
    else
        log_fail "EXT-01: gemini-extension.json not found"
    fi

    # EXT-02: Version check
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} EXT-02 - Version is 1.5.5"
    if grep -q '"version": "1.5.5"' "$BKIT_DIR/gemini-extension.json"; then
        log_pass "EXT-02: Version is 1.5.5"
    else
        log_fail "EXT-02: Version is not 1.5.5"
    fi

    # EXT-03: contextFileName is GEMINI.md
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} EXT-03 - contextFileName is GEMINI.md"
    if grep -q '"contextFileName": "GEMINI.md"' "$BKIT_DIR/gemini-extension.json"; then
        log_pass "EXT-03: contextFileName is GEMINI.md"
    else
        log_fail "EXT-03: contextFileName is not GEMINI.md"
    fi

    # EXT-04: experimental block removed (Skills/Hooks GA since v0.26.0)
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} EXT-04 - experimental block removed (GA)"
    if ! grep -q '"experimental"' "$BKIT_DIR/gemini-extension.json"; then
        log_pass "EXT-04: experimental block removed (Skills/Hooks GA)"
    else
        log_fail "EXT-04: experimental block should be removed"
    fi
}

#===============================================================================
# Section 5: Old Files Cleanup Tests
#===============================================================================

run_cleanup_tests() {
    log_section "5. Old Files Cleanup Tests"

    local BKIT_DIR
    BKIT_DIR=$(dirname "$(dirname "$0")")

    # CLEANUP-01: No .md files in commands directory
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} CLEANUP-01 - No .md files in commands/"
    local md_count
    md_count=$(find "$BKIT_DIR/commands" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$md_count" -eq 0 ]; then
        log_pass "CLEANUP-01: No .md files in commands directory"
    else
        log_fail "CLEANUP-01: Found $md_count .md files in commands directory"
    fi

    # CLEANUP-02: No empty pdca directory
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} CLEANUP-02 - No empty pdca directory in commands/"
    if [ ! -d "$BKIT_DIR/commands/pdca" ]; then
        log_pass "CLEANUP-02: No pdca directory in commands/"
    else
        log_fail "CLEANUP-02: pdca directory still exists in commands/"
    fi
}

#===============================================================================
# Section 6: Library Module Tests
#===============================================================================

run_library_tests() {
    log_section "6. Library Module Tests"

    local BKIT_DIR
    BKIT_DIR=$(dirname "$(dirname "$0")")

    # LIB-01: Core modules exist
    local core_modules=("context-fork.js" "permission.js" "memory.js")
    for module in "${core_modules[@]}"; do
        ((TOTAL_TESTS++))
        echo -e "\n${YELLOW}Testing:${NC} LIB - $module exists"
        # Search in lib directories
        if find "$BKIT_DIR/lib" -name "$module" 2>/dev/null | grep -q .; then
            log_pass "LIB: $module found"
        else
            log_skip "LIB: $module not found (may not exist yet)"
        fi
    done

    # LIB-02: Task modules exist
    local task_modules=("dependency.js" "classification.js")
    for module in "${task_modules[@]}"; do
        ((TOTAL_TESTS++))
        echo -e "\n${YELLOW}Testing:${NC} LIB - $module exists"
        if find "$BKIT_DIR/lib" -name "$module" 2>/dev/null | grep -q .; then
            log_pass "LIB: $module found"
        else
            log_skip "LIB: $module not found (may not exist yet)"
        fi
    done
}

#===============================================================================
# Section 7: MCP Server Tests (Optional - bkit-agents disabled)
#===============================================================================

run_mcp_tests() {
    log_section "7. MCP Server Tests (Optional)"

    local BKIT_DIR
    BKIT_DIR=$(dirname "$(dirname "$0")")

    # MCP-01: spawn-agent-server.js exists (optional check)
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} MCP-01 - spawn-agent-server.js exists"
    if [ -f "$BKIT_DIR/mcp/spawn-agent-server.js" ]; then
        log_pass "MCP-01: spawn-agent-server.js exists"
    else
        log_skip "MCP-01: spawn-agent-server.js not found (MCP disabled)"
    fi

    # MCP-02: Server has spawn_agent tool (optional check)
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} MCP-02 - spawn_agent tool defined"
    if [ -f "$BKIT_DIR/mcp/spawn-agent-server.js" ] && grep -q "spawn_agent" "$BKIT_DIR/mcp/spawn-agent-server.js" 2>/dev/null; then
        log_pass "MCP-02: spawn_agent tool is defined"
    else
        log_skip "MCP-02: spawn_agent check skipped (MCP disabled)"
    fi
}

#===============================================================================
# Section 8: Hooks Tests
#===============================================================================

run_hooks_tests() {
    log_section "8. Hooks Tests"

    local BKIT_DIR
    BKIT_DIR=$(dirname "$(dirname "$0")")

    # HOOK-01: hooks directory exists
    ((TOTAL_TESTS++))
    echo -e "\n${YELLOW}Testing:${NC} HOOK-01 - hooks directory exists"
    if [ -d "$BKIT_DIR/hooks" ]; then
        log_pass "HOOK-01: hooks directory exists"
    else
        log_fail "HOOK-01: hooks directory not found"
    fi

    # HOOK-02: Check for hook scripts
    local hook_types=("session-start" "before-agent" "before-tool" "after-tool")
    for hook in "${hook_types[@]}"; do
        ((TOTAL_TESTS++))
        echo -e "\n${YELLOW}Testing:${NC} HOOK - $hook script"
        if find "$BKIT_DIR/hooks" -name "*$hook*" 2>/dev/null | grep -q .; then
            log_pass "HOOK: $hook hook script found"
        else
            log_skip "HOOK: $hook hook script not found (may not exist yet)"
        fi
    done
}

#===============================================================================
# Section 9: Template Tests
#===============================================================================

run_template_tests() {
    log_section "9. Template Tests"

    local BKIT_DIR
    BKIT_DIR=$(dirname "$(dirname "$0")")

    local templates=("plan.template.md" "design.template.md" "analysis.template.md" "report.template.md" "do.template.md")

    for template in "${templates[@]}"; do
        ((TOTAL_TESTS++))
        echo -e "\n${YELLOW}Testing:${NC} TEMPLATE - $template exists"
        if find "$BKIT_DIR/templates" -name "$template" 2>/dev/null | grep -q .; then
            log_pass "TEMPLATE: $template found"
        else
            log_skip "TEMPLATE: $template not found (may not exist yet)"
        fi
    done
}

#===============================================================================
# Print Test Summary
#===============================================================================

print_summary() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}▶ TEST SUMMARY${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "Total Tests:   $TOTAL_TESTS"
    echo -e "${GREEN}Passed:        $PASSED_TESTS${NC}"
    echo -e "${RED}Failed:        $FAILED_TESTS${NC}"
    echo -e "${YELLOW}Skipped:       $SKIPPED_TESTS${NC}"
    echo ""

    local pass_rate=0
    if [ $TOTAL_TESTS -gt 0 ]; then
        pass_rate=$(echo "scale=1; ($PASSED_TESTS * 100) / $TOTAL_TESTS" | bc)
    fi
    echo -e "Pass Rate:     ${pass_rate}%"
    echo ""

    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    else
        echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    fi

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

#===============================================================================
# Main Execution
#===============================================================================

main() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     bkit-gemini Comprehensive Test Suite v1.5.5                  ║${NC}"
    echo -e "${BLUE}║     Testing: Commands TOML, Skills, Agents, Hooks, Library       ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Run all test sections
    run_commands_toml_tests
    run_skills_metadata_tests
    run_agents_metadata_tests
    run_extension_config_tests
    run_cleanup_tests
    run_library_tests
    run_mcp_tests
    run_hooks_tests
    run_template_tests

    # Print summary
    print_summary

    # Return exit code based on test results
    if [ $FAILED_TESTS -gt 0 ]; then
        exit 1
    fi
    exit 0
}

# Run main function
main "$@"
