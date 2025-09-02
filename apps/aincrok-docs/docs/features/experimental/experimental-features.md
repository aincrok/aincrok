# Experimental Features

Aincrok includes experimental features that are still under development. These features may be unstable, change significantly, or be removed in future versions. Use them with caution and be aware that they may not work as expected.

**Warning:** Experimental features may have unexpected behavior, including potential data loss or security vulnerabilities. Enable them at your own risk.

## Enabling Experimental Features

To enable or disable experimental features:

1.  Open the Aincrok settings (<Codicon name="gear" /> icon in the top right corner).
2.  Go to the "Advanced Settings" section.
3.  Find the "Experimental Features" section.
4.  Check or uncheck the boxes for the features you want to enable or disable.
5.  Click "Done" to save your changes.

## Current Experimental Features

The following experimental features are currently available:

## Morph Fast Apply

[**Morph Fast Apply**](./morph-fast-apply.md) provides ultra-fast code transformations using advanced morphing techniques. This feature can significantly reduce the time required for large-scale refactoring operations, variable renaming, and pattern-based code changes.

**Key Benefits:**

- Up to 80% faster code transformations
- Intelligent pattern recognition and application
- Support for bulk refactoring operations
- Maintains code integrity and formatting

**Use Cases:**

- Large-scale variable and function renaming
- API migration and updates
- Code pattern standardization
- Bulk formatting and style changes

⚠️ **Note:** As an experimental feature, always review changes before accepting them.

## Autocomplete

When enabled, Aincrok will provide inline code suggestions as you type. Currently this requires the Aincrok API Provider in order to use it.

## Concurrent file edits

When enabled, Aincrok can edit multiple files in a single request. When disabled, Aincrok must edit one file at a time. Disabling this can help when working with less capable models or when you want more control over file modifications.

### Power Steering

When enabled, Aincrok will remind the model about the details of its current mode definition more frequently. This will lead to stronger adherence to role definitions and custom instructions, but will use more tokens per message.

## Providing Feedback

If you encounter any issues with experimental features, or if you have suggestions for improvements, please report them on the [Aincrok Code GitHub Issues page](https://github.com/aincrok/aincrok) or join our [Discord server](https://kilo.love/discord) where we have channels dedciated to many experimental features.

Your feedback is valuable and helps us improve Aincrok!
