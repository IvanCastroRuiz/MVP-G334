import { AppDataSource } from './data-source.js';

const name = process.argv[2];

if (!name) {
  throw new Error('Migration name is required');
}

AppDataSource.initialize()
  .then(async () => {
    await AppDataSource.showMigrations();
    const file = await AppDataSource.generateMigration(name, {
      migrationsTableName: 'migrations',
    });
    console.log('Migration generated:', file);
    await AppDataSource.destroy();
  })
  .catch(async (error) => {
    console.error(error);
    await AppDataSource.destroy();
    process.exit(1);
  });
