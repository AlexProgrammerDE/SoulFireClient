import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

function findProtoFiles(dir: string): string[] {
  let files: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files = files.concat(findProtoFiles(fullPath));
    } else if (entry.endsWith('.proto')) {
      files.push(fullPath);
    }
  }
  return files;
}

function compileProtos(): void {
  const protoFiles = findProtoFiles('protos');
  if (protoFiles.length === 0) {
    console.log('No .proto files found.');
    return;
  }

  const command = `protoc --ts_out src/generated --ts_opt long_type_string --ts_opt optimize_code_size --ts_opt eslint_disable --ts_opt ts_nocheck --proto_path protos ${protoFiles.join(' ')}`;
  console.log(`Running: ${command}`);
  execSync(command, { stdio: 'inherit' });
}

compileProtos();
