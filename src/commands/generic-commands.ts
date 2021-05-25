import BaseCommands from "./base-commands";
import { makeSuccessMessage } from "../messages/success";
import { makeErrorMessage } from "../messages/error";
import { Game } from "../models/Game";
import { CollectorFilter, Message, MessageEmbed, MessageReaction } from "discord.js";
import stringSimilarity from 'string-similarity';
import { Joke } from "../models/Joke";
import axios from "axios";

class GenericCommands extends BaseCommands {
    async playJoke(type: string) {
        const guildId = this.message.guildId();
        const channelId = this.guild.mishkaChannelId;
        const authorId = this.message.author().id;

        const guildFound = this.client?.guilds.cache.find((guild: any) => {
            return guild.id === guildId;
        });

        const channel: any = guildFound?.channels.cache.find((channel: any) => {
            return channel.id === channelId;
        });

        if (this.guild.enabled !== true || !channel) {
            return;
        }

        const activeGames = await Game.find({ guildId, ended: false });

        if (activeGames.length > 0) {
            return channel.send(makeErrorMessage('Please wait until the game is over, before starting a new one!'));
        }

        const query = <any>{
            guildId: guildId,
        };

        if (type) {
            query.type = type;
        }

        const jokes = await Joke.aggregate([
            { $match: query },
            { $sample: { size: 1 } },
        ]);

        if (!jokes || jokes.length < 1) {
            return channel.send(makeErrorMessage('Oops, I couldn\'t find any jokes. Try adding one with `m/jokeadd`'));
        }

        const joke = jokes[0];

        const game = new Game({
            guildId: guildId,
            startedBy: authorId,
            winner: null,
            ended: false,
            jokeSetup: joke.setup,
        });

        await game.save();

        const messageEmbed = new MessageEmbed()
            .setTitle(`What's the punch line for this joke (#${joke.jokeId})?`)
            .setDescription(`
**${joke?.setup}**

*Reply with your best guesses! Make sure to add \`> \` to the start of your answer if you want others to be able to vote on it. For example:*

\`> To get to the other side\`
`)
            .setFooter(`You have 1 minute to share your answers`)
            .setColor('#61C5A9');


        const message2 = await channel.send(messageEmbed);

        const allPunchlines = <any>[];
        let correctMessage: any = null;

        try {
            let similarity = 0;

            const filter = (response: any) => {
                if (response.content.startsWith('>')) {
                    allPunchlines.push(response);
                }

                if (response.channel.id != channelId || response.guild.id !== guildId) {
                    return false;
                }

                similarity = stringSimilarity.compareTwoStrings(response.content.toLowerCase().trim(), joke.punchline.toLowerCase().trim());

                return similarity >= 0.55;
            };

            const correctMessages = await message2.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] });

            const updatedGame = await Game.findById(game.id);

            if (updatedGame?.ended === true) {
                return;
            }

            correctMessage = correctMessages.first();

            if (similarity >= 0.99) {
                return channel.send(makeSuccessMessage(`🎉 ${correctMessage.author}, you got it bang on! Awesome job  🦾`));
            }

            await channel.send(makeSuccessMessage(`🎉 ${correctMessage.author}, you got it right (well close enough) - Good job! The answer I had was:
                
                "*${joke.punchline}*"`));
        } catch (error) {
            const updatedGame = await Game.findById(game.id);

            if (updatedGame?.ended === true) {
                return;
            }

            await channel.send(makeErrorMessage(`😔 Nobody guessed it. I sure hope you made up for it with some hilarious punchlines of your own! The answer I was looking for was:
        
**${joke.punchline}**`));
        }

        try {
            if (allPunchlines.length <= 1 && !correctMessage) {
                await game.end();

                return channel.send(makeErrorMessage('*Hmm I didn\'t see enough punchlines from you to vote. Don\'t forget to add `> ` at the start of your message if you want people to vote on it.*'));
            }

            if (allPunchlines.length <= 1 && correctMessage) {
                await game.end(correctMessage.author.id);

                return channel.send(makeErrorMessage('*There\'s no voting this round as I couldn\'t see enough punchlines.\rDon\'t forget to add `> ` at the start of your message if you want people to vote on it.*'));
            }

            const voteDescriptions = allPunchlines.slice(0, 26).map((punchline: any, index: number) => {
                // Since actually A is represented by 65 and we want to represent it with one
                const letter = String.fromCharCode(65 + index).toLowerCase();

                return `:regional_indicator_${letter}: - "${punchline.content.substring(1).trim()}"`;
            });

            setTimeout(async () => {
                const voteMessageEmbed = new MessageEmbed()
                    .setTitle(`Time to vote for your favourite answers!`)
                    .setDescription(`**${joke.setup}**\n\n${voteDescriptions.join('\n\n')}`)
                    .setFooter(`You have 15 seconds to vote.`)
                    .setColor('GOLD')

                let updatedGame = await Game.findById(game.id);

                if (updatedGame?.ended === true) {
                    return;
                }

                const voteMessage: Message = await channel.send(voteMessageEmbed);

                // Add up to 26 reactions (the alphabet)
                for (let index = 0; index < (allPunchlines.slice(0, 26).length); index++) {
                    const letter = String.fromCharCode(65 + index);

                    const start = letter.codePointAt(0) || 0;
                    const emoji = String.fromCodePoint(start - 65 + 0x1f1e6);

                    allPunchlines[index].emoji = emoji;

                    await voteMessage.react(emoji);
                }

                const emojiFilter: CollectorFilter = async (reaction, user) => {
                    return true;
                };

                const reactions = await voteMessage.awaitReactions(emojiFilter, { time: 15000 });
                let mostReactionTotal = 0;

                const reactionResults = reactions.map((reaction: MessageReaction, emoji: String) => {
                    const users = reaction.users.cache.filter((user: any): boolean => {
                        return !user.bot;
                    }).array();

                    if (users.length > mostReactionTotal) {
                        mostReactionTotal = users.length;
                    }

                    return {
                        emoji,
                        total: users.length,
                    };
                });

                reactionResults.sort((a: any, b: any) => a.total - b.total);

                const funniestMessages = reactionResults.filter((result: any) => {
                    return result.total === mostReactionTotal && result.total > 0;
                });

                updatedGame = await Game.findById(game.id);

                if (updatedGame?.ended === true) {
                    return;
                }

                if (funniestMessages.length === 0 && !correctMessage) {
                    await game.end();

                    await voteMessage.reactions.removeAll();

                    return channel.send(makeErrorMessage(`Wow, okay so all of your answers sucked AND nobody got the right answer. Talk about a bad day in the office...`));
                }

                const endMessageDesc: Array<any> = [];
                const funniestResponses: Array<any> = [];

                if (correctMessage) {
                    endMessageDesc.push(`**Smartest:**
                    - ${correctMessage.author}
                    `);
                }

                if (funniestMessages.length > 0) {
                    endMessageDesc.push(`**Funniest:**`);
                    let funniestPeople: Array<any> = [];

                    funniestMessages.forEach((result: any) => {
                        const winner = allPunchlines.find((punchline: any) => {
                            return punchline.emoji === result.emoji;
                        });

                        if (winner) {
                            funniestResponses.push({
                                guildId: guildId,
                                user: winner.author.id,
                                setup: joke.setup,
                                punchline: winner.content,
                                votes: result.total || 0,
                            });

                            funniestPeople.push(`${winner.author}`);
                        }
                    });

                    funniestPeople = [...new Set(funniestPeople)];

                    funniestPeople.forEach((person: any) => {
                        endMessageDesc.push(`- ${person}`);
                    });
                }

                await voteMessage.reactions.removeAll();

                const endMessage = new MessageEmbed()
                    .setTitle(`And the winners are...`)
                    .setDescription(`${endMessageDesc.join('\n')}`)
                    .setColor('GREEN');

                await game.end(correctMessage?.author?.id, funniestResponses);

                return channel.send(endMessage);
            }, 1000);
        } catch (error) {
            console.log(error);

            if (game) {
                await game.end();
            }

            return channel.send(makeErrorMessage('Oops, something went wrong with this game. Try playing again.'));
        }
    }

    async addJoke(jokeData: string | null) {
        const guildId = this.message.guildId();
        const channelId = this.guild.mishkaChannelId;
        const authorId = this.message.author().id;

        const guildFound = this.client?.guilds.cache.find((guild: any) => {
            return guild.id === guildId;
        });

        const channel: any = guildFound?.channels.cache.find((channel: any) => {
            return channel.id === channelId;
        });

        if (this.guild.enabled !== true || !channel) {
            return;
        }

        if (!this.guild.isAdmin(authorId)) {
            return
        }

        if (!jokeData) {
            return channel.send(makeErrorMessage(`You can add a joke using the following format:
            
            \`m/jokeadd "This is the setup" "This is the punchline" category-name\``));
        }

        const regex = new RegExp(/"(.*)" "(.*)" (.*)/gm);
        const matches = regex.exec(jokeData);

        if (!matches || matches.length !== 4) {
            return channel.send(makeErrorMessage(`You can add a joke using the following format:
            
            \`m/jokeadd "This is the setup" "This is the punchline" category-name\``));
        }

        const [, setup, punchline, type] = matches;

        const jokeWithBiggestId = await Joke.find({ guildId: guildId }).sort({ jokeId: -1 }).limit(1);
        let biggestJokeId = 0;

        if (jokeWithBiggestId.length > 0) {
            biggestJokeId = jokeWithBiggestId[0]?.jokeId || 0;
        }

        const jokeId = biggestJokeId + 1;

        const joke = new Joke({
            guildId: guildId,
            jokeId,
            authorId,
            setup,
            punchline,
            type
        });

        await joke.save();

        return channel.send(makeSuccessMessage(`Joke (#${jokeId}) successfully added!`));
    }

    async deleteJoke(params: string) {
        const guildId = this.message.guildId();
        const channelId = this.guild.mishkaChannelId;
        const authorId = this.message.author().id;

        const guildFound = this.client?.guilds.cache.find((guild: any) => {
            return guild.id === guildId;
        });

        const channel: any = guildFound?.channels.cache.find((channel: any) => {
            return channel.id === channelId;
        });

        if (this.guild.enabled !== true || !channel) {
            return;
        }

        if (!this.guild.isAdmin(authorId)) {
            return
        }

        if (!params) {
            return channel.send(makeErrorMessage('Please add a joke id (e.g. #3).'));
        }

        const joke = await Joke.findOne({ guildId: guildId, jokeId: parseInt(params) });

        if (!joke) {
            return channel.send(makeErrorMessage('Joke not found with that id'));
        }

        await joke.remove();

        return channel.send(makeSuccessMessage('Joke was successfully deleted'));
    }

    async addAdmin(adminId: string) {
        const guildId = this.message.guildId();
        const channelId = this.guild.mishkaChannelId;
        const authorId = this.message.author().id;

        const guildFound = this.client?.guilds.cache.find((guild: any) => {
            return guild.id === guildId;
        });

        const channel: any = guildFound?.channels.cache.find((channel: any) => {
            return channel.id === channelId;
        });

        if (this.guild.enabled !== true || !channel) {
            return;
        }

        if (authorId != this.Config.ownerId) {
            return;
        }

        if (!adminId) {
            return channel.send(makeErrorMessage(`Please mention the user you wish to make an admin: \`m/jaddadmin @user\``));
        }

        if (this.guild.isAdmin(adminId)) {
            return channel.send(makeErrorMessage('User is already an admin'));
        }

        await this.guild.addAdmin(adminId);

        return channel.send(makeSuccessMessage(`User was added as an admin.`));
    }

    async removeAdmin(adminId: string) {
        const guildId = this.message.guildId();
        const channelId = this.guild.mishkaChannelId;
        const authorId = this.message.author().id;

        const guildFound = this.client?.guilds.cache.find((guild: any) => {
            return guild.id === guildId;
        });

        const channel: any = guildFound?.channels.cache.find((channel: any) => {
            return channel.id === channelId;
        });

        if (this.guild.enabled !== true || !channel) {
            return;
        }

        if (authorId != this.Config.ownerId) {
            return;
        }

        if (!adminId) {
            return channel.send(makeErrorMessage(`Please mention the user you wish to remove from admins: \`m/jremoveadmin @user\``));
        }

        if (!this.guild.isAdmin(adminId)) {
            return channel.send(makeErrorMessage('User was never an admin to begin with.'));
        }

        await this.guild.removeAdmin(adminId);

        return channel.send(makeSuccessMessage(`User was removed from admins.`));
    }

    async clear() {
        const guildId = this.message.guildId();
        const channelId = this.guild.mishkaChannelId;
        const authorId = this.message.author().id;

        const guildFound = this.client?.guilds.cache.find((guild: any) => {
            return guild.id === guildId;
        });

        const channel: any = guildFound?.channels.cache.find((channel: any) => {
            return channel.id === channelId;
        });

        if (this.guild.enabled !== true || !channel) {
            return;
        }

        if (!this.guild.isAdmin(authorId)) {
            return
        }

        await Game.updateMany({ guildId: guildId, ended: false }, { $set: { ended: true } });

        return channel.send(makeSuccessMessage(`All active joke games have been ended.`));
    }

    async setMishkaChannel(channelId: string | null) {
        if (this.message.author().id != this.Config.ownerId) {
            return;
        }

        if (!channelId) {
            channelId = this.message.original().channel.id;
        } else {
            channelId = channelId.replace('<#', '').replace('>', '');
        }

        await this.guild.setMishkaChannelId(channelId);

        return this.message.send(makeSuccessMessage(`Mishka channel set.`));
    }

    async setMishkaBot(botId: string | null) {
        if (this.message.author().id != this.Config.ownerId) {
            return;
        }

        if (!botId) {
            return this.message.send(makeErrorMessage(`Please mention the bot.`));
        }

        botId = botId.replace('<@!', '').replace('>', '').replace('<@&', '');

        await this.guild.setMishkaBotId(botId);

        return this.message.send(makeSuccessMessage(`Mishka bot set.`));
    }

    async enable() {
        if (this.message.author().id != this.Config.ownerId) {
            return;
        }

        if (!this.guild.mishkaChannelId || !this.guild.mishkaBotId) {
            return this.message.send(makeErrorMessage(`Please select a channel and bot first.`));
        }

        await this.guild.enable();

        return this.message.send(makeSuccessMessage(`Bot enabled.`));
    }

    async disable() {
        if (this.message.author().id != this.Config.ownerId) {
            return;
        }

        await this.guild.disable();

        return this.message.send(makeSuccessMessage(`Bot disabled.`));
    }

    async importJokes() {
        const guildId = this.message.guildId();
        const channelId = this.guild.mishkaChannelId;
        const authorId = this.message.author().id;

        const guildFound = this.client?.guilds.cache.find((guild: any) => {
            return guild.id === guildId;
        });

        const channel: any = guildFound?.channels.cache.find((channel: any) => {
            return channel.id === channelId;
        });

        if (this.guild.enabled !== true || !channel) {
            return;
        }

        if (!this.guild.isAdmin(authorId)) {
            return
        }

        const response = await axios.get('https://v2.jokeapi.dev/joke/Miscellaneous,Dark,Pun,Spooky?blacklistFlags=religious,political,racist,sexist&type=twopart&amount=10');

        const jokes = response?.data?.jokes || [];

        const jokeWithBiggestId = await Joke.find({ guildId: guildId }).sort({ jokeId: -1 }).limit(1);
        let biggestJokeId = 0;

        if (jokeWithBiggestId.length > 0) {
            biggestJokeId = jokeWithBiggestId[0]?.jokeId || 0;
        }

        let jokeId = biggestJokeId + 1;

        for (let index = 0; index < jokes.length; index++) {
            const jokeToImport = jokes[index];

            await Joke.findOneAndUpdate({
                guildId: guildId,
                setup: jokeToImport?.setup,
            }, {
                $setOnInsert: {
                    guildId: guildId,
                    jokeId: jokeId + index,
                    setup: jokeToImport?.setup,
                    punchline: jokeToImport?.delivery,
                    type: jokeToImport?.category.toLowerCase(),
                },
            }, {
                upsert: true,
            });
        }

        return channel.send(makeSuccessMessage(`Jokes imported.`));
    }

    testSimilarity(param: string | null) {
        const [a, b] = param?.split(' ~VS~ ') || [];

        const similarity = stringSimilarity.compareTwoStrings(a, b);

        return this.message.send(`Similarity: ${similarity}`);
    }
}

export { GenericCommands };
