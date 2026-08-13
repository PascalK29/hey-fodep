import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { z } from 'zod';
import { openDatabase, makeRepositories, DbHandle, schema } from '@heyfodep/db';
import { analyseSolvabilite } from '@heyfodep/kernel';
import path from 'node:path';
import fs from 'node:fs';

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, { 
  origin: true 
});

const uiDistPath = path.resolve(process.cwd(), '../ui/dist');
if (fs.existsSync(uiDistPath)) {
  await fastify.register(fastifyStatic, {
    root: uiDistPath,
    prefix: '/',
  });
  
  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api/')) {
      reply.status(404).send({ error: 'Not found' });
    } else {
      reply.sendFile('index.html');
    }
  });
}

// Initialiser la base de données
const dbPath = path.join(process.cwd(), 'heyfodep.sqlite');
let dbHandle: DbHandle;
let repos: ReturnType<typeof makeRepositories>;

// Routes
fastify.get('/ping', async (request, reply) => {
  return { status: 'ok' };
});

fastify.get('/api/solvabilite/:arreteId', async (request, reply) => {
  const { arreteId } = request.params as { arreteId: string };
  const saisies = await repos.saisies.asInputRecord(arreteId);
  const analysis = analyseSolvabilite(saisies);
  
  return {
    inputs: saisies,
    analysis
  };
});

// Upsert saisie
fastify.post('/api/saisies', async (request, reply) => {
  const schema = z.object({
    arreteId: z.string(),
    codeDispru: z.string(),
    valeur: z.string()
  });
  const data = schema.parse(request.body);
  await repos.saisies.upsert({
    arreteId: data.arreteId,
    codeDispru: data.codeDispru,
    valeur: data.valeur
  });
  return { success: true };
});

// Start server
const start = async () => {
  try {
    dbHandle = await openDatabase(dbPath);
    repos = makeRepositories(dbHandle.db);
    
    // Check if there are any saisies, if not, create a mock arrete
    const mockArreteId = 'arrete-2026';
    const existing = await repos.saisies.asInputRecord(mockArreteId);
    if (Object.keys(existing).length === 0) {
      console.log('Seeding initial mock data...');
      
      // Ensure Etablissement exists
      await dbHandle.db.insert(schema.etablissements).values({ id: 'etab-1', nom: 'Banque HEYFODEP' }).onConflictDoNothing();
      
      // Ensure Arrete exists
      await dbHandle.db.insert(schema.arretes).values({ id: mockArreteId, etablissementId: 'etab-1', dateArrete: '2026-06-30' }).onConflictDoNothing();

      const MOCK_INPUTS: Record<string, string> = {
        'FPI10': '10000',
        'FPI15': '2000',
        'FPI22': '500',
        'FPI29': '12500', 
        'FPI39': '2500',  
        'FPI41': '3000',  
        'RC63': '120000', 
        'RM39': '15000',  
        'RO13': '8000',   
      };
      for (const [code, valeur] of Object.entries(MOCK_INPUTS)) {
        await repos.saisies.upsert({ arreteId: mockArreteId, codeDispru: code, valeur });
      }
    }
    
    await fastify.listen({ port: 3001, host: '127.0.0.1' });
    console.log('API Server running on http://127.0.0.1:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
