import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import type { Application } from 'express';

export function loadOpenApiSpec() {
  const specPath = path.join(__dirname, '../../openapi.yaml');
  return YAML.load(specPath);
}

export function setupSwagger(app: Application): void {
  const spec = loadOpenApiSpec();

  app.get('/api/docs/openapi.yaml', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../openapi.yaml'));
  });

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: 'Dubicolt Automotive API',
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );
}
