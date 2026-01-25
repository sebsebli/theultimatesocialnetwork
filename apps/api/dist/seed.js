"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const dataSource = app.get(typeorm_1.DataSource);
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const existing = await userRepo.findOne({ where: { handle: 'devuser' } });
    if (!existing) {
        const user = userRepo.create({
            id: '550e8400-e29b-41d4-a716-446655440000',
            handle: 'devuser',
            displayName: 'Developer',
            bio: 'I build things.',
        });
        await userRepo.save(user);
        console.log('Seeded User:', user.id);
    }
    else {
        console.log('User already exists:', existing.id);
    }
    await app.close();
}
bootstrap();
//# sourceMappingURL=seed.js.map