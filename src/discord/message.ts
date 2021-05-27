import { Message as DiscordMessage, User as DiscordUser } from 'discord.js';
import { User } from './user';

interface IMessage {
    content(): string;
    original(): DiscordMessage;
    author(): User;
    guildId(): string | null;
    channelId(): string | null;
    isFromBot(): boolean;
    send(data: any): Promise<any>;
}

class Message implements IMessage {
    constructor(private discordMessage: DiscordMessage) { }

    content(): string {
        return this.discordMessage.content;
    }

    original(): DiscordMessage {
        return this.discordMessage;
    }

    author(): User {
        const user: DiscordUser = this.discordMessage.author;

        return new User(user.id, user.username);
    }

    guildId(): string | null {
        return this.discordMessage?.guild?.id || null;
    }

    channelId(): string | null {
        return this.discordMessage?.channel?.id || null;
    }

    isFromBot(): boolean {
        return this.discordMessage.author.bot;
    }

    send(data: any): Promise<any> {
        return this.discordMessage.channel.send(data);
    }

    edit(data: any): Promise<any> {
        return this.discordMessage.edit(data);
    }
}

export { Message, IMessage }
