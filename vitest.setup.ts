// Setup file for vitest
import { beforeAll, vi } from 'vitest';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Mock environment variables
beforeAll(() => {
  process.env.NEXT_PUBLIC_MAX_FILE_SIZE = '52428800';
});

// Mock File.prototype.text() for jsdom compatibility
if (typeof File !== 'undefined' && !File.prototype.text) {
  File.prototype.text = function() {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}
