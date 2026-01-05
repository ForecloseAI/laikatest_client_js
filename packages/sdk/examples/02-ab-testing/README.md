# A/B Testing Demo

Demonstrates experiment prompt fetching and score tracking using `@laikatest/sdk`.

## What This Demo Shows

- **Experiment Prompts**: Fetch A/B tested prompts with `getExperimentPrompt()`
- **Automatic Bucketing**: Users are consistently assigned to variants
- **Score Tracking**: Track outcomes with `prompt.pushScore()` for analysis
- **Trace Integration**: Experiment context is auto-injected into traces

## Prerequisites

Before running this demo, create an experiment in LaikaTest:

1. Go to [LaikaTest Dashboard](https://laikatest.com)
2. Create a new experiment titled `demo-experiment`
3. Add at least 2 variants with different system prompts
4. Start the experiment

## Setup

```bash
# Install dependencies
npm install

# Copy and edit environment variables
cp .env.example .env
# Add your API keys to .env
```

## Run

```bash
npm start
```

## Expected Output

```
Laika SDK initialized
Tracing enabled: true
Experiments enabled: true

User ID: user-abc123

Fetching experiment: demo-experiment
Experiment ID: exp-xyz789
Bucket/Variant ID: variant-a
Prompt Version ID: pv-123
Prompt Content: You are a helpful assistant...

Making OpenAI request with experiment prompt...

Response: Hello! I'm here to help...

Pushing score...
Score pushed: Success

Shutting down...
Done!
```

## How A/B Testing Works

1. **User Bucketing**: When you call `getExperimentPrompt()` with a `userId`, that user is consistently assigned to the same variant
2. **Prompt Retrieval**: The SDK returns the prompt content for the assigned variant
3. **Score Tracking**: Call `pushScore()` to record outcomes (success rate, ratings, etc.)
4. **Analysis**: View experiment results in the LaikaTest dashboard

## Customizing

Edit `index.ts` to:
- Change `EXPERIMENT_TITLE` to match your experiment
- Modify the scores tracked based on your success metrics
- Use actual user IDs instead of random ones
