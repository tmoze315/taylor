import dotenv from 'dotenv';
import _ from 'lodash';

dotenv.config();

import { connect } from 'mongoose';
import { Config } from './config/adventure';
import Application from './application';
import { Discord } from './discord/discord';
import { Message as DiscordMessage, Client } from 'discord.js';
import { Message } from './discord/message';
import { registry } from '@alexlafroscia/service-locator';
import { makeErrorMessage } from './messages/error';
import { Guild } from './models/Guild';

(async () => {
    await connect(Config.mongodb.url, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
        useCreateIndex: Config.mongodb.useCreateIndex,
        autoIndex: Config.mongodb.autoIndex,
    });

    const discord = new Discord();

    await discord.login(async (discordMessage: DiscordMessage, client: Client) => {
        const application = new Application;
        const message = new Message(discordMessage);

        try {
            await application.handleMessage(message, client);
        } catch (error) {
            console.error(error);

            message.send(makeErrorMessage('Oops, it looks like something went wrong. Please try again. If the problem persists, get in touch with an admin.'));
        }
    });
})();
