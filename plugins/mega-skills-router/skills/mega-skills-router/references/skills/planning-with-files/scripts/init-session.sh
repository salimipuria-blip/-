#!/bin/bash
# Initialize planning files for a new session
# Usage: ./init-session.sh [project-name]

set -e

PROJECT_NAME="${1:-project}"
DATE=$(date +%Y-%m-%d)

echo "Initializing planning files for: $PROJECT_NAME"

# Create task_plan.md if it doesn't exist
if [ ! -f "task_plan.md" ]; then
    cat > task_plan.md << 'EOF'
# Task Plan: [Brief Description]

Use this file as the durable roadmap for the task. Create it before complex work and keep it current as phases change.

## Goal

State the intended end result in one clear sentence.

[One sentence describing the end state]

## Next Step

Record the single action that should happen next. Update it whenever the active phase or immediate action changes.

[The single next action. Update whenever phase status changes.]

## Current Phase

Name the phase currently being worked on.

Phase 1

## Phases

Break the task into three to seven verifiable phases. Use only `pending`, `in_progress`, or `complete` for each status and update the value when work advances.

### Phase 1: Requirements & Discovery

- [ ] Understand user intent
- [ ] Identify constraints and requirements
- [ ] Document findings in findings.md
- **Status:** in_progress

### Phase 2: Planning & Structure

- [ ] Define technical approach
- [ ] Create project structure if needed
- [ ] Document decisions with rationale
- **Status:** pending

### Phase 3: Implementation

- [ ] Execute the plan step by step
- [ ] Write code to files before executing
- [ ] Test incrementally
- **Status:** pending

### Phase 4: Testing & Verification

- [ ] Verify all requirements met
- [ ] Document test results in progress.md
- [ ] Fix any issues found
- **Status:** pending

### Phase 5: Delivery

- [ ] Review all output files
- [ ] Ensure deliverables are complete
- [ ] Deliver to user
- **Status:** pending

## Key Questions

Record important questions and replace them with answers as they are resolved.

1. [Question to answer]
2. [Question to answer]

## Decisions Made

Record significant choices and the reason for each one.

| Decision | Rationale |
|----------|-----------|
|          |           |

## Errors Encountered

Record each distinct error, the attempt number, and the resolution. Change the approach before retrying a failed action.

| Error | Attempt | Resolution |
|-------|---------|------------|
|       | 1       |            |

## Notes

- Update phase status as work progresses: `pending` to `in_progress` to `complete`.
- Re-read the goal and next step before major decisions.
- Log errors promptly so failed approaches are not repeated.
EOF
    echo "Created task_plan.md"
else
    echo "task_plan.md already exists, skipping"
fi

# Create findings.md if it doesn't exist
if [ ! -f "findings.md" ]; then
    cat > findings.md << 'EOF'
# Findings & Decisions

## Requirements
-

## Research Findings
-

## Technical Decisions
| Decision | Rationale |
|----------|-----------|

## Issues Encountered
| Issue | Resolution |
|-------|------------|

## Resources
-
EOF
    echo "Created findings.md"
else
    echo "findings.md already exists, skipping"
fi

# Create progress.md if it doesn't exist
if [ ! -f "progress.md" ]; then
    cat > progress.md << EOF
# Progress Log

## Session: $DATE

### Current Status
- **Phase:** 1 - Requirements & Discovery
- **Started:** $DATE

### Actions Taken
-

### Test Results
| Test | Expected | Actual | Status |
|------|----------|--------|--------|

### Errors
| Error | Resolution |
|-------|------------|
EOF
    echo "Created progress.md"
else
    echo "progress.md already exists, skipping"
fi

echo ""
echo "Planning files initialized!"
echo "Files: task_plan.md, findings.md, progress.md"
