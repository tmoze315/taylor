interface IConfig {
    enabled: boolean,
    adminPassword: string,
    ownerIds: Array<string>,
    prefix: string,
    discord: {
        key: string,
    },
    mongodb: {
        url: string,
        useCreateIndex: boolean,
        autoIndex: boolean,
    },
};

const Config = <IConfig>{
    ownerIds: process.env.OWNER_IDS?.split(';'),
    adminPassword: process.env.ADMIN_PASSWORD,
    prefix: process.env.PREFIX || '-',
    discord: {
        key: process.env.DISCORD_KEY,
    },
    mongodb: {
        url: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/taylor',
        useCreateIndex: process.env.MONGODB_CREATE_INDEX || true,
        autoIndex: process.env.MONGODB_AUTO_INDEX || true,
    },
};

export { Config, IConfig }
