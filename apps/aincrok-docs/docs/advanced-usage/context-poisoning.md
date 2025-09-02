# Context Poisoning

Context poisoning occurs when an AI coding session becomes contaminated with incorrect information, leading to degraded performance and unreliable outputs. Understanding and managing context poisoning is crucial for maintaining productive AI-assisted development workflows.

## What is Context Poisoning?

Context poisoning happens when misleading or incorrect information accumulates in an AI conversation, causing the model to make poor decisions and generate suboptimal code. Unlike temporary errors, context poisoning creates a persistent degradation that affects all subsequent interactions in the session.

## Recognizing the Symptoms

### Performance Degradation

- **Declining Code Quality**: Generated code becomes increasingly problematic
- **Repeated Mistakes**: The AI makes the same errors despite corrections
- **Inconsistent Behavior**: Unpredictable responses to similar requests
- **Tool Misalignment**: Inappropriate tool selection for given tasks

### Specific Warning Signs

- **Hallucinated Information**: AI references non-existent files, functions, or configurations
- **Ignored Context**: AI overlooks important project details you've previously shared
- **Contradictory Responses**: AI gives conflicting advice within the same session
- **Orchestration Failures**: Complex multi-step tasks break down unexpectedly

### User Experience Issues

- **Frustrating Interactions**: Conversations become circular or unproductive
- **Temporary Fixes**: Solutions that seem to work but don't address root causes
- **Increased Manual Intervention**: You find yourself constantly correcting the AI
- **Loss of Context Awareness**: AI forgets important project constraints

## Common Causes

### Model-Related Issues

- **Hallucination**: AI generates plausible but incorrect information
- **Context Window Overflow**: Important information gets pushed out of active context
- **Pattern Misrecognition**: AI misinterprets code patterns or structures
- **Training Bias**: Pre-trained biases interfere with project-specific requirements

### Input Contamination

- **Misleading Code Comments**: Outdated or incorrect comments in referenced files
- **Inconsistent Naming**: Variables or functions with confusing or misleading names
- **Legacy Code Artifacts**: Deprecated patterns that confuse the AI
- **Mixed Coding Standards**: Inconsistent styles that create confusion

### Conversation Factors

- **Information Overload**: Too much context provided at once
- **Contradictory Instructions**: Conflicting requirements given over time
- **Error Amplification**: Small mistakes that compound over multiple interactions
- **Context Drift**: Gradual deviation from original project requirements

## Prevention Strategies

### Clean Context Management

- **Start Fresh for New Features**: Begin new conversations for unrelated tasks
- **Limit Context Scope**: Focus on specific problems rather than entire codebases
- **Regular Context Pruning**: Periodically summarize and restart conversations
- **Clear Instructions**: Provide specific, unambiguous requirements

### Quality Input Practices

- **Validate Code Examples**: Ensure shared code is accurate and current
- **Update Comments**: Keep code comments synchronized with actual functionality
- **Consistent Naming**: Use clear, descriptive names for variables and functions
- **Remove Deprecated Code**: Clean up legacy code before sharing context

### Conversation Hygiene

- **One Task at a Time**: Focus on single, well-defined objectives
- **Immediate Corrections**: Address misunderstandings immediately
- **Context Validation**: Regularly verify the AI's understanding of your project
- **Progressive Disclosure**: Share information incrementally as needed

## Recovery Strategies

### The Hard Reset Approach

**Most Reliable Solution**: Start a completely new conversation session

- Close the current chat session
- Open a new session with fresh context
- Provide clean, accurate project information
- Avoid copying content from the poisoned session

### Context Reconstruction

When you must continue the same session:

1. **Acknowledge the Problem**: Explicitly state that context has become unreliable
2. **Provide Clean Summary**: Give a fresh, accurate overview of the current state
3. **Reset Expectations**: Clearly restate your objectives and constraints
4. **Validate Understanding**: Confirm the AI's interpretation before proceeding

### Information Quarantine

- **Isolate Contaminated Content**: Don't reference problematic code or explanations
- **Provide Alternative Sources**: Use clean examples or documentation
- **Validate All Outputs**: Double-check all AI-generated content
- **Gradual Reintroduction**: Slowly rebuild context with verified information

## Advanced Recovery Techniques

### Checkpoint Strategy

- **Save Good States**: Note conversation points where context was clean
- **Document Key Decisions**: Record important architectural choices
- **Version Control Integration**: Use git commits to track clean states
- **Session Bookmarking**: Mark successful interaction points for reference

### Context Reconstruction Protocol

1. **Problem Acknowledgment**: "The current context seems contaminated, let me provide a clean summary"
2. **State Declaration**: "Here's the current accurate state of the project..."
3. **Goal Restatement**: "My objective is to..."
4. **Constraint Clarification**: "The key constraints are..."
5. **Validation Request**: "Please confirm your understanding before we proceed"

### Verification Workflows

- **Code Review**: Manually review all AI suggestions before implementation
- **Test-Driven Validation**: Use tests to verify AI-generated code
- **Documentation Cross-Check**: Compare AI explanations with official documentation
- **Peer Consultation**: Get second opinions on AI-suggested architectures

## Long-term Management

### Session Lifecycle

- **Planned Obsolescence**: Expect sessions to degrade over time
- **Regular Refresh**: Proactively start new sessions before poisoning occurs
- **Context Archiving**: Save important insights before discarding sessions
- **Clean Slate Scheduling**: Build session resets into your workflow

### Project Organization

- **Modular Conversations**: Keep different features in separate sessions
- **Documentation Maintenance**: Maintain clean project documentation for context
- **Code Quality Focus**: Keep codebase clean to prevent input contamination
- **Training Data**: Build a library of good examples for future sessions

### Team Coordination

- **Shared Standards**: Establish team guidelines for AI interaction
- **Context Sharing**: Share clean context templates across team members
- **Best Practices Documentation**: Document successful context management strategies
- **Regular Training**: Keep team updated on context management techniques

## When Recovery Isn't Working

### Persistent Problems

If context poisoning continues even after hard resets:

- **Review Input Quality**: Check for consistently poor source code
- **Examine Interaction Patterns**: Look for problematic conversation habits
- **Consider Model Limitations**: Some tasks may be beyond current AI capabilities
- **Seek Human Expertise**: Complex problems may require human insight

### Alternative Approaches

- **Break Down Problems**: Tackle smaller, more manageable pieces
- **Use Different AI Models**: Try alternative providers or models
- **Manual Implementation**: Handle critical sections manually
- **Hybrid Workflows**: Combine AI assistance with traditional development

## Key Takeaways

**Context poisoning is inevitable** in extended AI coding sessions. The key is recognizing it early and responding appropriately:

- **Hard reset is the most reliable solution** - don't try to "fix" a poisoned session
- **Prevention is better than cure** - maintain clean context practices
- **Sessions are disposable** - treat conversations as temporary tools, not permanent assets
- **Quality input leads to quality output** - contaminated context produces contaminated results

Remember: There's no "magic bullet" prompt that can fix a fundamentally poisoned context. Once context is compromised, the most productive approach is to start fresh with clean, accurate information.
