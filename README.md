# Wren Automation relay

This app lets Wren Automation (wrenautomation.com), a small marketing company, post and read on Reddit through the Developer Platform. It replaces a Data API client.

## What it does

- It makes our own posts and replies, as the app account u/wren-automation, in subreddits where the app is installed.
- It reads our own posts, the comments on them and the app account's inbox.
- William Jin, the founder, reads and approves each post and reply in our tool before it goes out.

It never votes, follows, sends direct messages or chat, or scrapes subreddits. It does not sell, share or train models on Reddit data.

## How it works

1. Our tool puts each approved post or reply in a queue on our server.
2. Once a minute, the app's scheduled task asks our server for the queue. It sends back what the last jobs answered in the same request.
3. The app runs each job with the Devvit Reddit client.

When Reddit grants external endpoints, our server calls `/external/run` with one job instead, and the minute wait goes away. Both paths run the same code.

At most about 3 posts and 20 replies a day.

## Fetch Domains

The following domains are requested for this app:

- `app.wrenautomation.com`: our own server, which holds the queue of approved posts and replies. Devvit has no other way to get work from an outside service without external endpoints. The app sends one request a minute, and only to the path `/__reddit/relay`.

## Setup

1. Install the app on a subreddit we moderate.
2. Set the relay token: `npx devvit settings set relayToken`. Our server checks this token on each request.
3. No other settings. Moderators see none.

## Develop

- `npm install`, then `npm run dev` to build and playtest.
- `npm test` runs the typecheck, lint and build.
- `npm run publish` uploads a new version.

## Policies

- Terms: https://wrenautomation.com/terms
- Privacy: https://wrenautomation.com/privacy

## License

[PolyForm Shield 1.0.0](LICENSE.md). Required Notice: Copyright 2026 William Jin (https://wrenautomation.com)
