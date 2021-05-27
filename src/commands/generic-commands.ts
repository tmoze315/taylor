import BaseCommands from "./base-commands";
import { makeSuccessMessage } from "../messages/success";
import { makeErrorMessage } from "../messages/error";
import { DiscordService } from "../services/discord-service";
import { MessageEmbed } from "discord.js";
import { Question } from "../models/Question";
import { ray } from "node-ray";
import { Dare } from "../models/Dare";

class GenericCommands extends BaseCommands {
    async addAdmin(adminId: string) {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const authorId = this.message.author().id;

        if (!this.isOwner(authorId)) {
            return;
        }

        if (!adminId) {
            return DiscordService.send(guildId, channelId, makeErrorMessage(`Please mention the user you wish to make an admin: \`?t addadmin @user\``));
        }

        if (this.guild.isAdmin(adminId)) {
            return DiscordService.send(guildId, channelId, makeErrorMessage('User is already an admin'));
        }

        await this.guild.addAdmin(adminId);

        return DiscordService.send(guildId, channelId, makeSuccessMessage(`User was added as an admin.`));
    }

    async removeAdmin(adminId: string) {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const authorId = this.message.author().id;

        if (!this.isOwner(authorId)) {
            return;
        }

        if (!adminId) {
            return DiscordService.send(guildId, channelId, makeErrorMessage(`Please mention the user you wish to remove from admins: \`?t removeadmin @user\``));
        }

        if (!this.guild.isAdmin(adminId)) {
            return DiscordService.send(guildId, channelId, makeErrorMessage('User was never an admin to begin with.'));
        }

        await this.guild.removeAdmin(adminId);

        return DiscordService.send(guildId, channelId, makeSuccessMessage(`User was removed from admins.`));
    }

    async help() {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const author = this.message.original().author;

        const truthCategories = (await Question.distinct('type', { guildId: guildId })).map(type => `\`${type}\``);
        const dareCategories = (await Dare.distinct('type', { guildId: guildId })).map(type => `\`${type}\``);

        const desc = [
            `**Talk to me**`,
            `\`?t keywords\` - Show a list of all the keywords I respond to`,
            ``,
            `**Play Truth or Dare with me**`,
            `\`?t truth [category]\` - Gives a random question that has to be answered truthfully. Default category is \`sfw\`. Supported categories are: ${truthCategories.join(', ')}`,
            `\`?t dare [category]\` - Gives a random dare that has to be completed. Default category is \`sfw\`. Supported categories are: ${dareCategories.join(', ')}`,
            ``,
            `**Horoscopes**`,
            `\`?t horoscope [sign]\` - Show your horoscope for today`,
            `\`?t sign [sign]\` - Alias for \`?t horoscope [sign]\``,
        ];

        const message = new MessageEmbed()
            .setTitle('Help')
            .setDescription(desc.join('\n'))
            .setColor('#FBCFE8');

        await DiscordService.send(guildId, channelId, message);

        if (this.guild.isAdmin(author.id)) {
            const desc = [
                `**Manage admins**`,
                `\`?t addadmin [@user]\` - Allow a user to run admin commands`,
                `\`?t removeadmin [@user]\` - Remove admin rights from a user`,
                ``,
                `**Truth or Dare**`,
                `\`?t truthadd\` - Add a new question. Run command for more info`,
                `\`?t truthremove [id]\` - Remove a question`,
                `\`?t truthdelete [id]\` - Alias for \`truthremove\``,
                `\`?t dareadd\` - Add a new dare. Run command for more info`,
                `\`?t dareremove [id]\` - Remove a dare`,
                `\`?t daredelete [id]\` - Alias for \`dareremove\``,
                ``,
                `**Keywords and responses**`,
                `\`?t keywordadd\` - Add a keyword to listen for and respond with a given message. Supports multiple responses per keyword (run this command multiple times using the same keyword and different responses). Run command for more info`,
                `\`?t keywordremove [id]\` - Remove a keyword and all responses`,
                `\`?t keyworddelete [id]\` - Alias for \`keywordremove\``,
            ];

            const dmMessage = new MessageEmbed()
                .setTitle('Help - Admin Commands')
                .setDescription(desc.join('\n'))
                .setColor('#FBCFE8');

            return author.send(dmMessage);
        }

        return;
    }
}

export { GenericCommands };
