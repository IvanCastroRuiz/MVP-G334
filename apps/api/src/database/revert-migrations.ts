import { AppDataSource } from './data-source.js';

AppDataSource.initialize()
  .then(async () => {
    await AppDataSource.undoLastMigration();
    await AppDataSource.destroy();
  })
  .catch(async (error) => {
    console.error(error);
    await AppDataSource.destroy();
    process.exit(1);
  });
