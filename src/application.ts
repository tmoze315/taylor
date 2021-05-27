import { Message } from './discord/message';
import { Client } from 'discord.js';
import availableCommands from './config/available-commands';
import availableListeners from './config/available-listeners';
import { Guild } from './models/Guild';
import { registry } from '@alexlafroscia/service-locator';
import { Config } from './config/adventure';
import { ray } from 'node-ray';

class Application {
    async handleMessage(message: Message, client: Client) {
        registry.register('client', client);
        registry.register('message', message);
        registry.register('Config', Config);

        const startsWithMention = message.content().startsWith(`<@!${client.user?.id}> `) || message.content().startsWith(`<@${client.user?.id}> `);

        // Run all message listeners
        for (const listenerConfig of availableListeners) {
            const commandInstance = new listenerConfig.class();

            await commandInstance.handle();
        };

        const prefix = Config.prefix || '?t';

        if ((!message.content().toLowerCase().startsWith(prefix) && !startsWithMention) || message.isFromBot()) {
            return;
        }

        let messageContent = message.content();
        let command = messageContent?.split(/ +/g)?.shift()?.toLowerCase()?.trim();

        if (startsWithMention) {
            command = 'crystalball';
            messageContent = messageContent.replace(`<@!${client.user?.id}>`, '').replace(`<@${client.user?.id}>`, '').trim();
        } else {
            messageContent = messageContent.slice(prefix.length).trim();
        }

        if (!command) {
            return;
        }

        // Fine the matching 'route' (aka which commands file and method to call)
        const route = (availableCommands as any)[command];

        // We don't support the given command
        if (!route) {
            return;
        }

        const guildId = message.guildId();
        const guildMembers = guildId ? client?.guilds.cache.get(guildId)?.members?.cache : null;

        let guild = null;

        if (guildId) {
            guild = await Guild.findOne({ id: guildId }).exec();
        }

        if (!guild) {
            const newGuild = new Guild({
                id: guildId,
            });

            guild = await newGuild.save();
        }

        registry.register('guild', guild);
        registry.register('guildMembers', guildMembers);

        // Create the controller, so we have a reference to the message available at all times
        const commandInstance = new route.class();

        return commandInstance[route.method](messageContent.replace(command, '').trim());
    }
}

export default Application;