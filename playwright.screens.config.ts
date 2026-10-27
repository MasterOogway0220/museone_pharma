import base from "./playwright.config";
import { defineConfig } from "@playwright/test";

// Landing page screenshots (scripts/screens). Not part of the e2e suite.
export default defineConfig({ ...base, testDir: "scripts/screens" });
