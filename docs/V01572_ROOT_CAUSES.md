# v0.15.72 root causes

Random Practice freeze risk came from overlapping Random decorators, unrelated application-wide DOM observers, and synchronous exhaustive combination scoring. v0.15.72 consolidates scheduling and scopes observers without changing score math.
