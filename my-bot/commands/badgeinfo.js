const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('badgeinfo')
    .setDescription('Get detailed information about a badge')
    .addStringOption(option =>
      option.setName('badge')
        .setDescription('The badge you want to learn more about')
        .setRequired(true)
        .addChoices(
          { name: 'Discord Employee', value: 'Discord Employee' },
          { name: 'Discord Partner', value: 'Discord Partner' },
          { name: 'Discord Moderator', value: 'Discord Moderator' },
          { name: 'HypeSquad Events', value: 'HypeSquad Events' },
          { name: 'HypeSquad Houses', value: 'HypeSquad Houses' },
          { name: 'Bug Hunter and Bug Hunter Terminator', value: 'Bug Hunter and Bug Hunter Terminator' },
          { name: 'Early Supporter', value: 'Early Supporter' },
          { name: 'Active Developer', value: 'Active Developer' },
          { name: 'Verified Developer', value: 'Verified Developer' },
          { name: 'Nitro', value: 'Nitro' },
          { name: 'Server Booster', value: 'Server Booster' },
          { name: 'Bot', value: 'Bot' },
          { name: 'Verified Bot', value: 'Verified Bot' },
        )),

  async execute(interaction) {
    const badgeInfo = {
      'Discord Employee': {
        emoji: '<:discord_employee:1359464851357044791>',
        description: 'If you ever run into an individual with the Discord Staff badge, this person spends most of their week at Discord HQ, thinking of the next best thing to improve your Discord experience and dreaming of when the office is going to get a soft-serve machine.',
      },
      'Discord Partner': {
        emoji: '<:discord_partner:1359468134364348508>',
        description: 'Designed for active and engaged communities, the Partner Program distinguished the best servers out there. This Partner Server Owner badge was given to owners of thriving communities and creators that showed an authentic enthusiasm for Discord.\n\n **This badge is no longer obtainable.**',
      },
      'Discord Moderator': {
        emoji: '<:discord_certifiedmoderator:1359468333560496191>',
        description: 'Long ago, Discord granted the Certified Discord Moderator badge to those who were part of our moderation programs.\nThese individuals would receive this badge to show they have mastered the Moderator Academy courses and were active participants in our moderator program ecosystem.\n\n The badge has since evolved into the Moderator Program Alumni badge, as a way to thank everyone that was a part of the moderator ecosystem before Thursday, December 1st, 2022.\n\n **This badge can no longer be obtained!**',
      },
      'HypeSquad Events': {
        emoji: '<:discord_hypesquadevents:1359468496635035660>',
        description: 'Along with the Hypesquad House badges, there was even a Hypesquad Events badge.\nThis badge was obtained by those that attended an event, in the name of Hypesquad. Event Coordinators ran the events themselves, such as organizing a university club or planning a LAN event.\n\n **This badge is no longer obtainable.**',
      },
      'HypeSquad Houses': {
        emoji: '<:discord_hypesquadbrilliance:1359468816522023024>',
        description: 'Have you ever wondered how to obtain one of these three badges? Each one represents a HypeSquad you can join by taking the quick five-question personality test on the desktop or app. \n\nIf you would like to take the test:\n\n1. Head into your User Settings by pressing the cog wheel button located near your username. \n\n2. Then, select the HypeSquad tab and press the Join HypeSquad button to start the test. \n\nOnce you have completed the test, you will be assigned to the House of Bravery, the House of Brilliance, or the House of Balance. You can also click on your profile to take a look at your new HypeSquad House badge. \n\nIf you’d like to learn more about the HypeSquad Houses, you can take a look at the HypeSquad House Breakdown article [here](https://support.discord.com/hc/en-us/articles/360007553672)!.',
      },
      'Bug Hunter and Bug Hunter Terminator': {
        emoji: '<:discord_bughunter:1359469667147714662>',
        description: 'A mastermind of QA testing and detective work, the Bug Hunter badge is awarded to the most hard-working of those in the Bug Hunter community. There’s even a Golden Bug Hunter badge for those who reach the highest hunter level by going above and beyond! \n\nThose interested in earning this badge will have to actively participate in the Discord Testers community. \n\n :warning: Note: Submitting a bug through the Support Portal will not count towards earning the badge. \n\nIf you run into a bug or are interested in learning more about the Discord Testers program, you can find out more [here](https://support.discord.com/hc/en-us/articles/360046057772).',
      },
      'Early Supporter': {
        emoji: '<:discord_earlysupporter:1359470409027813406>',
        description: 'Before there were two styles of Discord Nitro, there was simply a $5 version of Nitro. After the $10 tier of Nitro was introduced, we granted the Early Supporter badge to anyone who supported us in the early years of Discord as a thank you gift! \n\nAnyone who purchased Nitro at any point before Wednesday, October 10th, 2018 received this badge. **This badge can no longer be obtained!** \n\nMore details about this legacy profile badge can be seen at the [Legacy Nitro Classic FAQ](https://support.discord.com/hc/en-us/articles/360017949691)',
      },
      'Active Developer': {
        emoji: '<:discord_activedeveloper:1359470440921305119>',
        description: 'Those delightful apps in your server were crafted with love by our incredible developer community. They may be helping you and your server automate tasks, play games, get to know each other better, or create your most treasured memes. App developers who are actively bringing more joy to your Discord experience may have an Active Developer badge on their profiles. If you are an active app developer on Discord, find out more on how you can grab your badge [here](https://support-dev.discord.com/hc/en-us/articles/10113997751447-Active-Developer-Badge).',
      },
      'Verified Developer': {
        emoji: '<:discord_botdev:1359472102406750211>',
        description: 'The Verified Bot Developer badge is awarded to developers who create bots that are verified by Discord.\n\n This badge signifies that the bot is officially recognized by Discord and has passed a verification process to ensure it meets certain standards.\n\n-# This is an non-official description, as the badge is no longer mentioned on the "Profile Badges 101" article.',
      },
      'Nitro': {
        emoji: '<:discord_nitro:1359470786913767527>',
        description: 'If you see this badge on an account, it means that they are subscribed to **Discord Nitro**! Anyone subscribed to **Nitro**, **Nitro Classic**, or **Nitro Basic** will have the Discord Nitro badge reflected on their profile.\n\n By hovering over this badge, the subscription date will appear to let others know how long they’ve been subscribed.\n\n If you see other Discord users sending custom emojis and stickers, they are typically holders of the **Discord Nitro** Badge. Learn more about perks offered through Discord Nitro [here](https://support.discord.com/hc/en-us/articles/115000435108)!',
      },
      'Server Booster': {
        emoji: '<a:discord_serverbooster:1359470818903724113>',
        description: 'This pink badge represents a user who directly supports one of their favorite servers through **Server Boosting**. By hovering over the Server Booster badge, you’ll see how long they’ve boosted servers\n If an individual continues server boosting without any pause, the badge will **evolve and the design will change over time**.\n :warning: Note:\n- If you stop boosting servers, or you are no longer boosting any servers at any time, your boosting streak and badge will **reset to the first level!**\n - If you have multiple boosted servers, the badge will always be whichever is your **longest Server Boost streak** (or the longest milestone of time achieved for your Server Boost).\n Server Boosting **FAQ**: [Click me!](https://support.discord.com/hc/en-us/articles/360028038352)',
        image: 'https://support.discord.com/hc/article_attachments/10928413771031',
      },
      'Bot': {
        emoji: '<:discord_bo:1359471191978545335>',
        description: 'A badge awarded to users who are bots, indicating that the account is automated and non-human.\n\n-# This is an non-official description, as the badge is no longer mentioned on the "Profile Badges 101" article.',
      },
      'Verified Bot': {
        emoji: '<:discord_certifiedbot:1359471226539606178>',
        description: 'For bots that are verified by Discord, indicating that they are widely used and have passed Discord’s review process.\n\n-# This is an non-official description, as the badge is no longer mentioned on the "Profile Badges 101" article.',
      },
    };

    const badge = interaction.options.getString('badge');
    const selectedBadge = badgeInfo[badge];

    if (!selectedBadge) {
      return interaction.reply({ content: 'Badge not found!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`${selectedBadge.emoji} ${badge} Badge Information`)
      .setDescription(selectedBadge.description)
      .setColor(0x5865F2);

    return interaction.reply({ embeds: [embed] });
  },
};
