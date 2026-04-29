# Fullcount rules

## Core setup
- The game is a baseball at-bat in bottom of the 9th, game tied, bases loaded, full count, two outs.
- Two ERC721 NFTs (from any collections) play: one `Pitcher`, one `Batter`.
- A player starts a session by staking one NFT as either role; another player joins with the opposite role.
- Optional gated sessions: starter can require a valid EIP-712 signature from joiners.

## Session phases
- `Waiting`: session has one player only.
- `Commit`: once both players joined, each submits exactly one signed commitment (`pitch` or `swing`) within `SecondsPerPhase`.
- `Reveal`: after both commits, both reveal signed moves within `SecondsPerPhase`.
- `Resolved`: session finishes immediately when second reveal arrives.
- `Expired`: if phase timer passes before required action, session expires.

## Allowed moves
- Pitch move: `speed` (`Fast` or `Slow`), `vertical` (HighBall/HighStrike/Middle/LowStrike/LowBall), `horizontal` (InsideBall/InsideStrike/Middle/OutsideStrike/OutsideBall), plus `nonce`.
- Swing move: `kind` (`Contact`, `Power`, `Take`), same vertical/horizontal grid, plus `nonce`.

## Outcome resolution
- If batter `Take`s:
  - Any ball location => `Ball`
  - Otherwise => `Strike`
- Otherwise, outcome uses weighted random sampling from distance buckets (`L1` distance between pitch and swing):
  - distance 0: strong hitter advantage
  - distance 1-2: mixed, mostly hitter-positive
  - distance 3-4: mostly pitcher-positive
  - distance 5+: always `Strike`
- Possible pitch outcomes: `Strike`, `Ball`, `Foul`, `Single`, `Double`, `Triple`, `HomeRun`, `InPlayOut`.

## At-bat progression
- An at-bat starts from the first session and can chain additional sessions automatically.
- Count rules:
  - `Strike`: +1 strike, or strikeout at 3 strikes.
  - `Ball`: +1 ball, or walk at 4 balls.
  - `Foul`: adds strike only if current strikes < 2.
  - `Single`, `Double`, `Triple`, `HomeRun`, `InPlayOut`: end the at-bat immediately with matching final result.
- After each non-terminal `Strike`/`Ball`/`Foul`, a new session auto-starts with same pitcher and batter NFTs.

## Exit and abort rules
- A starter can abort only while waiting for opponent join.
- Unstake is allowed only when session is waiting, resolved, or expired.
- A player cannot commit or reveal after session expiry.

## Expiry behavior
- If neither reveal happens before reveal timeout, session expires.
- Expired sessions are not auto-resolved; players can unstake via expiry state.

## Known unresolved rule
- Contract comments describe intended "default win" if one player reveals and the other fails to reveal in time, but current implementation marks that state as expired instead of awarding winner.
