#!/usr/bin/env node
import { readMetadata, readNotes, readTopics, validateMetadata } from './metadata-core.mjs';

const [notes, metadata, topics] = await Promise.all([
  readNotes(),
  readMetadata(),
  readTopics(),
]);

const result = validateMetadata({ notes, metadata, topics });

console.log('Metadata validation report');
console.log(`notes: ${notes.length}`);
console.log(`metadata entries: ${Object.keys(metadata).length}`);
console.log(`topics: ${topics.length}`);

if (result.warnings.length > 0) {
  console.log(`\nwarnings: ${result.warnings.length}`);
  for (const warning of result.warnings) console.log(`  - ${warning}`);
}

if (result.errors.length > 0) {
  console.error(`\nerrors: ${result.errors.length}`);
  for (const error of result.errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('\nmetadata: valid');
