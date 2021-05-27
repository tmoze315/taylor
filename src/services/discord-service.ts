import { Client, MessageEmbed } from 'discord.js';
import { registry } from '@alexlafroscia/service-locator';
import { ray } from 'node-ray';
import { makeErrorMessage } from '../messages/error';

class DiscordService {
    static send(guildId: string | null, channelId: string | null, message: MessageEmbed | string) {
        const client: Client = registry.lookup('client');

        const guildFound = client.guilds.cache.find((guild: any) => {
            return guild.id === guildId;
        });

        const channel: any = guildFound?.channels.cache.find((channel: any) => {
            return channel.id === channelId;
        });

        return channel.send(message);
    }
}

export { DiscordService };
