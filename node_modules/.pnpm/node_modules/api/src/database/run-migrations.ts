import { AppDataSource } from './data-source.js';

AppDataSource.initialize()
  .then(async () => {
    await AppDataSource.runMigrations();
    await AppDataSource.destroy();
  })
  .catch(async (error) => {
    console.error(error);
    await AppDataSource.destroy();
    process.exit(1);
  });
