/// <reference path="../.astro/types.d.ts" />

import type { User, Session } from '@/db/schema';

declare global {
  namespace App {
    interface Locals {
      user?: User;
      session?: Session;
    }
  }
}
