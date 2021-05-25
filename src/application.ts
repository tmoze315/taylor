import { IMessage, Message } from './discord/message';
import { inject } from '@alexlafroscia/service-locator';
import { IConfig } from './config/adventure';
import { Client, Collection, GuildMember } from 'discord.js';
import availableCommands from './config/available-commands';
// import availableListeners from './config/available-listeners';
import { IGuild, Guild } from './models/Guild';
import { ray } from 'node-ray';
import { registry } from '@alexlafroscia/service-locator';
import { Config } from './config/adventure';

class Application {
    async handleMessage(message: Message, client: Client) {
        // Run all message listeners
        // if (this.guild.enabled === true) {
        //     for (const listenerConfig of availableListeners) {
        //         const commandInstance = new listenerConfig.class();

        //         await commandInstance.handle();
        //     };
        // }

        const prefix = Config.prefix || 'm/';

        if (!message.content().toLowerCase().startsWith(prefix) || message.isFromBot()) {
            return;
        }

        const messageContent = message.content().slice(prefix.length).trim();
        const command = messageContent?.split(/ +/g)?.shift()?.toLowerCase()?.trim();

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

        registry.register('client', client);
        registry.register('message', message);
        registry.register('guild', guild);
        registry.register('guildMembers', guildMembers);
        registry.register('Config', Config);

        // Create the controller, so we have a reference to the message available at all times
        const commandInstance = new route.class();

        return commandInstance[route.method](messageContent.replace(command, '').trim());
    }
}

export default Application;