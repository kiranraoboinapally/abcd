const { writeFileSync } = require('fs');
const dotenv = require('dotenv');
const path = require('path');

console.log('Loading environment variables from .env');

const envConfig = dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (envConfig.error) {
  throw envConfig.error;
}

const targetPath = path.resolve(__dirname, '../environments/environment.ts');

const envVars = envConfig.parsed;

const envFileContent = `export const environment = {
  production: false,
  apiUrl: '${envVars.API_URL}'
};
`;

writeFileSync(targetPath, envFileContent);

console.log('Angular environment.ts generated from .env');
