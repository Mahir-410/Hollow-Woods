// ============================================================
//  THE HOLLOW WOODS - Complete ASCII Horror Game Engine
// ============================================================

// ---------- UTILITIES ----------
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = rand(0, i); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------- GAME STATE ----------
let G = {};

function initGameState() {
  const riddles = [
    { q: "I have cities but no houses, forests but no trees, and water but no fish. What am I?", a: ["map","a map","treasure map"], hint: "Something that represents the world..." },
    { q: "The more you take, the more you leave behind. What am I?", a: ["footsteps","steps","footprints"], hint: "Think about walking..." },
    { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?", a: ["echo","an echo"], hint: "Sound bouncing back..." },
    { q: "I have keys but no locks. I have space but no room. You can enter but can't go inside. What am I?", a: ["keyboard","a keyboard"], hint: "You're using one right now..." },
    { q: "What has a head, a tail, is brown, and has no legs?", a: ["penny","coin","a penny","a coin"], hint: "Money..." }
  ];

  const entityNames = ["The Hollow One", "It", "The Shadow", "The Watcher", "The Devourer"];
  const entityDescriptions = [
    "a mass of writhing darkness with too many limbs",
    "a tall silhouette that bends at wrong angles",
    "a void in the shape of something almost human",
    "a towering figure of tangled shadows and whispering",
    "a thing that wears the dark like a second skin"
  ];

  const riddleIndex = rand(0, riddles.length - 1);
  const entityIndex = rand(0, entityNames.length - 1);

  const puzzleOrder = shuffle(["cabin_lock", "cave_inscription", "shrine_riddle", "moon_altar", "lake_crossing"]);

  const wildClues = shuffle([
    "Scratches on a tree read: 'The cabin holds warmth and truth...'",
    "A torn note on the ground: 'Light reveals what darkness hides...'",
    "Carved bark: 'The moonstone bends moonlight into safe passage...'",
    "A buried journal page: 'Rope saves the fool from the black water...'",
    "Wind carries a whisper: 'Solve all five, or the map lies...'"
  ]);

  G = {
    turn: 0,
    currentRoom: "forest_edge",
    inventory: [],
    puzzlesSolved: { cabin_lock: false, cave_inscription: false, shrine_riddle: false, moon_altar: false, lake_crossing: false },
    puzzleCount: 0,
    totalPuzzles: 5,
    hasMap: false,
    mapComplete: false,
    moonlitNow: true,
    moonPhase: rand(1, 4),
    moonCycle: rand(4, 8),
    entityRoom: "deep_woods",
    entityActive: false,
    entityAggro: 0,
    entityMoveTimer: rand(3, 6),
    cabinUnlocked: false,
    torchLit: false,
    ropeUsed: false,
    shrineSolved: false,
    lakeCrossed: false,
    riddle: riddles[riddleIndex],
    entityName: entityNames[entityIndex],
    entityDesc: entityDescriptions[entityIndex],
    puzzleOrder: puzzleOrder,
    wildClues: wildClues,
    cluesFound: [],
    torchFound: false,
    keyFound: false,
    ropeFound: false,
    moonstoneFound: false,
    moonstoneUsed: false,
    caveExplored: false,
    cabinSearched: false,
    deepWoodsWarning: false,
    talkedToGhost: false,
    ghostHint: false,
    lakeMapFound: false,
    altarMapFound: false,
    gameOver: false,
    seenIntro: false,
    commandHistory: [],
    historyIndex: -1,
    customItems: {}
  };

  randomizeItemPlacements();
}

function randomizeItemPlacements() {
  G.keyLocation = pick(["dense_thicket", "clearing"]);
  G.ropeLocation = pick(["cave_entrance", "forest_edge"]);
  G.ladderLocation = rand(0, 1) === 0 ? "underground_lake" : "deep_cave";
  G.ghostRoom = pick(["old_cabin", "deep_woods", "clearing"]);
  G.secretNoteRoom = pick(["dense_thicket", "cave_entrance", "underground_lake"]);
}

// ---------- ASCII ART ----------
const ART = {
  stickFigure: `   O
  /|\\
  / \\`,

  stickFigureLantern: `   O  *
  /|\\/
  / \\`,

  stickFigureTorch: `   O  (
  /|\\/
  / \\`,

  forest_edge: `
      *  .  *       .    *      .
  .        *    .       .
     ___        ___              *
    /   \\  .   /   \\  ___
   / ### \\    / ### \\ /   \\  .
  |  ###  |  |  ### |  ### |
  |  ###  |  |  ### |  ### |
  |__###__|  |__###_|__###_|
   ||||||    ||||||  ||||||
   ||||||    ||||||  ||||||

        .
  *         .        *

     O
    /|\\
    / \\
  [FOREST EDGE]
  You stand at the edge of a dark wood.
  The path behind you has vanished.`,

  dense_thicket: `
   # ## ## # ## ## #
  ## ## ## ## ## ## #
   # ## ## ## ## ## #
  ## ## ## ## ## ## #
   # ## #   O  # ## #
  ## ## ## /|\\ ## ## #
   # ## ## / \\ ## ## #
  ## ## ## ## ## ## #
   # ## ## ## ## ## #

  [DENSE THICKET]
  Twisted trees block most light.
  Paths lead in four directions.`,

  old_cabin: `
         /\\
        /  \\
       /    \\
      /______\\
      |  __  |
      | |  | |
      | |__| |
      |  __  |
      | |  | |
      | |__| |
      |______|

  (O stands before the cabin)
  [OLD CABIN]
  A decrepit cabin. The door is locked.`,

  old_cabin_lit: `
         /\\
        /*  \\
       / **  \\
      /______\\
      |  __  |
  *   | |  | |  *
      | |__| |
      |  __  |
  *   | |  | |  *
      | |__| |
      |______|

  (O stands before the lit cabin)
  [OLD CABIN - UNLOCKED]
  Warm light flickers inside.`,

  cabin_interior: `
  |\\\\\\\\\\\\\\\\\\\\\\\\|
  | []  ~~~  [] |
  |   [    ]    |
  | []  ___  [] |
  |    |   |    |
  | [] | O | [] |
  |    |___|    |
  |\\\\\\\\\\\\\\\\\\\\\\\\|

  [CABIN INTERIOR]
  Dusty shelves line the walls.
  A cold fireplace sits in the corner.`,

  cave_entrance: `
       ___
      /   \\
     / ___ \\
    / /   \\ \\
   / /     \\ \\
  | |       | |
  | |       | |
  | |       | |
  | |       | |
  | |___ ___| |
  |___________|

  (O stands at the mouth)
  [CAVE ENTRANCE]
  Darkness yawns from within.
  Damp air seeps out.`,

  dark_cave: `
  .  . .. .  .  .  . .
  . ___________  .  . .
  |/           \\|  .  .
  |   .  .  .   | . ..
  | .   O   .   |  . .
  |  .  |  .  . |.  .
  |/\\ . |/\\  .  | . .
     \\|/    \\|/

  [DARK CAVE]
  Almost pitch black.
  Strange markings cover the walls.`,

  dark_cave_lit: `
  .  . .. .  .  .  . .
  . ___________  .  . .
  |/  *    *   \\|  .  .
  |   *  .  *   | . ..
  | .  * O  .   |  . .
  |  *  |* .  . |.  .
  |/\\ * |/\\  .  | . .
     \\|/    \\|/

  [DARK CAVE - ILLUMINATED]
  Torch light reveals ancient inscriptions
  carved deep into the stone.`,

  clearing: `
          .     *     .
     *        .      *
           .     .
      *        .
     .    *         .
    ____        ____
   /    \\ .    /    \\  *
  | #### |    | #### |
  | #### |  O | #### |
  | #### | /|\\| #### |
  |______| / \\|______|
   ||||||   ||||||||||
   ||||||   ||||||||||

  [MOONLIT CLEARING]
  The canopy opens here. Moonlight
  pours down, silver and cold.`,

  ancient_shrine: `
        _____
       / \\ / \\
      /   V   \\
     /  -----  \\
    |  [     ]  |
    |   \\   /   |
    |    \\_/    |
    |     |     |
    |  ___|___  |
    | |       | |
    |_|   O   |_|
     |  /|\\   |
     | / \\    |
     |/___\\___|

  [ANCIENT SHRINE]
  Weathered stones arranged in a circle.
  A central pedestal awaits something...`,

  underground_lake: `
  ~~~~~~~~~~~~~~~~~~~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~
  ~~~  ~~~  ~~~  ~~~  ~~~
  ~~   ~~   ~~   ~~   ~~
  ~~~  ~~~  ~~~  ~~~  ~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~
  |                      |
  |  O                   |
  | /|\\                  |
  | / \\   ~~~~~~~~~~~~~~
  |______________________

  [UNDERGROUND LAKE]
  An vast underground lake.
  Still black water stretches into
  darkness. Something glints across.`,

  underground_lake_crossed: `
  ~~~~~~~~~~~~~~~~~~~~~~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~
  ~~~  ~~~  ~~~  ~~~  ~~~
  ~~   ~~   ~~   ~~   ~~
  ~~~  ~~~  ~~~  ~~~  ~~~
  ~~~~~~~~~~~~~~~~~~~~~~~~
  |                      |
  |                  O   |
  |                 /|\\  |
  ~~~~~~~~~~~~~~~  / \\  |
  |_________________|____|

  [UNDERGROUND LAKE - CROSSED]
  You made it across. The far shore
  is narrow and slippery.`,

  deep_woods: `
  # ## ## ## ## ## ## ## #
  ## ## @@@ ## ## ## ## ##
  # ## @@###@@ ## ## ## #
  ## ##@@# O #@@## ## ## ##
  # ## @@###@@ ## ## ## #
  ## ## @@@ ## ## ## ## ##
  # ## ## ## ## ## ## ## #

  [DEEP WOODS]
  The trees are ancient here.
  The air is thick and cold.
  You feel... watched.`,

  deep_cave: `
  ???????????????????????
  ?  __________________
  ? |/    CHAMBER      \\
  ? |    .  .  .  .     |
  ? |  .    .  .   .    |
  ? |    . O .  .   .   |
  ? |  .  |  .  .  .    |
  ? |/\\   |/\\  .   .    |
  ?    \\|/    \\|/       |
  ???????????????????????

  [DEEP CAVE]
  The passage narrows into
  something older. Bones litter
  the ground. This feels wrong.`,

  entity_approach: `
  ???????????????????????
  ?   _____             ?
  ?  /     \\            ?
  ? |  ???  |           ?
  ? | ?/|\\? |           ?
  ?  \\?/ \\?/            ?
  ?   |||               ?
  ?  /|||\\              ?
  ? / ||| \\             ?
  ?   |||               ?
  ???????????????????????

  [IT IS HERE]`,

  good_ending: `
      *    .  *    .    *
   .    *    . *    .  *
  *   .    *    .  *    .
     .  *    . *    .  *
    _____
   /     \\
  | ^   ^ |
  |  ---  |     *
   \\_____/
     |O|
    /| |\\
    / \\ /\\

  ~ THE MOON SHINES BRIGHT ~
  ~ THE PATH IS CLEAR ~`,

  bad_ending: `
  ???????????????????????
  ?                     ?
  ?    @@@@@@@@@        ?
  ?   @@       @@       ?
  ?  @@  ???   @@       ?
  ?  @@  /|\\   @@       ?
  ?  @@  / \\   @@       ?
  ?   @@       @@       ?
  ?    @@@@@@@@@        ?
  ?         ||||        ?
  ?     ~~~~||||~~~~    ?
  ?    ~~~~~~~~~~~~~~   ?
  ???????????????????????
  ~ THE DEEP TAKES ALL ~`
};

// ---------- ROOM DATA ----------
const ROOMS = {
  forest_edge: {
    name: "Forest Edge",
    exits: { north: "dense_thicket", east: "clearing", west: "cave_entrance" },
    description: "You stand at the edge of a dark wood. The path behind you has vanished into thin air. Moonlight filters through the canopy.",
    lookText: "Tall oaks tower above you. A worn path leads NORTH into the thicket. To the EAST, you see a clearing where moonlight breaks through. To the WEST, rocky ground slopes toward what might be a cave.",
    items: [],
    danger: false,
    moonExposed: false
  },
  dense_thicket: {
    name: "Dense Thicket",
    exits: { south: "forest_edge", north: "deep_woods", east: "old_cabin", west: "clearing" },
    description: "Twisted trees press close, their branches like grasping fingers. Barely any light reaches here.",
    lookText: "The trees here are wrong. Their bark is dark as blood. You can make out paths in all four directions. Something rustles to the NORTH.",
    items: [],
    danger: true,
    moonExposed: false
  },
  old_cabin: {
    name: "Old Cabin",
    exits: { west: "dense_thicket" },
    description: "A decrepit cabin sits among the trees. It looks like it hasn't been lived in for decades.",
    lookText: "The cabin's wood is gray and rotting. A heavy lock secures the door. There might be something useful inside.",
    items: [],
    enterable: true,
    locked: true,
    danger: false,
    moonExposed: false
  },
  cave_entrance: {
    name: "Cave Entrance",
    exits: { east: "forest_edge", north: "dense_thicket", south: "dark_cave" },
    description: "A gaping maw in the hillside. Cold air breathes outward. Stalactites hang like teeth.",
    lookText: "The cave mouth is wide enough for two people. Water drips from the ceiling. The passage goes SOUTH into darkness.",
    items: [],
    danger: false,
    moonExposed: false
  },
  dark_cave: {
    name: "Dark Cave",
    exits: { north: "cave_entrance", south: "deep_cave" },
    description: "Absolute darkness. You can barely see your hand in front of your face.",
    lookText: "Without light, you can barely navigate. You sense carvings on the walls but cannot read them. There might be a passage deeper SOUTH.",
    items: [],
    requiresLight: true,
    danger: true,
    moonExposed: false
  },
  clearing: {
    name: "Moonlit Clearing",
    exits: { west: "forest_edge", north: "dense_thicket", east: "ancient_shrine", south: "deep_woods" },
    description: "The canopy opens wide here. Pure moonlight floods the clearing, making the grass glow silver.",
    lookText: "The clearing is bathed in moonlight. The trees seem to pull back from its edges, as if afraid. Paths lead in all directions. You feel safe here... for now.",
    items: [],
    danger: false,
    moonExposed: true
  },
  ancient_shrine: {
    name: "Ancient Shrine",
    exits: { west: "clearing", north: "underground_lake" },
    description: "A circle of weathered standing stones surrounds a stone pedestal. This place feels very old.",
    lookText: "The stones are covered in faded carvings. The pedestal in the center has a depression shaped like a crescent moon. A passage NORTH leads underground.",
    items: [],
    danger: true,
    moonExposed: true
  },
  underground_lake: {
    name: "Underground Lake",
    exits: { south: "ancient_shrine" },
    description: "A vast underground lake stretches before you. The water is black as ink. Something glints on the far shore.",
    lookText: "The lake is enormous. The far shore is just visible in the darkness. You could try to CROSS it... if you had something to help you swim. The only exit is SOUTH.",
    items: [],
    danger: true,
    moonExposed: false
  },
  deep_woods: {
    name: "Deep Woods",
    exits: { south: "dense_thicket" },
    description: "The trees are impossibly old here. Their trunks are as wide as houses. The darkness is almost alive.",
    lookText: "This is the heart of the forest. The trees have no names. The ground is soft with centuries of decay. You hear breathing that is not your own.",
    items: [],
    danger: true,
    moonExposed: false
  },
  deep_cave: {
    name: "Deep Cave",
    exits: { north: "dark_cave" },
    description: "The passage has led you deep underground. Bones crunch underfoot. The air smells of old death.",
    lookText: "The walls are covered in claw marks. Skulls line the floor. This is a charnel house. You must leave before whatever lives here returns.",
    items: [],
    danger: true,
    moonExposed: false
  }
};

// ---------- COMMAND HANDLER ----------
function parseCommand(input) {
  const raw = input.trim().toLowerCase();
  if (!raw) return;
  G.commandHistory.push(raw);
  G.historyIndex = G.commandHistory.length;

  const parts = raw.split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1).join(' ');

  switch (cmd) {
    case 'go': case 'g': case 'move': case 'walk': return cmdGo(args || parts[1]);
    case 'north': case 'n': return cmdGo('north');
    case 'south': case 's': return cmdGo('south');
    case 'east': case 'e': return cmdGo('east');
    case 'west': case 'w': return cmdGo('west');
    case 'look': case 'l': case 'examine': case 'x': return cmdLook(args);
    case 'take': case 'get': case 'grab': case 'pick': return cmdTake(args.replace('up ',''));
    case 'use': return cmdUse(args);
    case 'open': return cmdOpen(args);
    case 'read': return cmdRead(args);
    case 'inventory': case 'inv': case 'i': return cmdInventory();
    case 'help': case 'h': case '?': return cmdHelp();
    case 'answer': case 'say': return cmdAnswer(args);
    case 'light': return cmdLight(args);
    case 'cross': return cmdCross();
    case 'solve': return cmdSolve(args);
    case 'pray': return cmdPray();
    case 'listen': return cmdListen();
    case 'hide': return cmdHide();
    case 'run': return cmdRun(args);
    case 'throw': return cmdThrow(args);
    case 'combine': case 'mix': return cmdCombine(args);
    case 'map': case 'checkmap': return cmdMap();
    case 'hint': return cmdHint();
    case 'history': return cmdHistory();
    case 'clear': document.getElementById('message-log').innerHTML = ''; log('Screen cleared.', 'system'); break;
    default: log("Unknown command. Type HELP for a list of commands.", "system");
  }
}

// ---------- COMMANDS ----------
function cmdGo(dir) {
  if (!dir) { log("Go where? Specify a direction: north, south, east, west.", "system"); return; }
  dir = dir.trim().toLowerCase();
  const validDirs = ['north','south','east','west','n','s','e','w'];
  const dirMap = { n:'north', s:'south', e:'east', w:'west' };
  if (dirMap[dir]) dir = dirMap[dir];
  if (!validDirs.includes(dir)) { log(`"${dir}" is not a valid direction.`, "system"); return; }

  const room = ROOMS[G.currentRoom];

  if (G.currentRoom === 'old_cabin' && G.cabinUnlocked === false && dir !== 'west') {
    log("The cabin is small. The only way out is back the way you came.", "system");
    return;
  }

  if (G.currentRoom === 'underground_lake' && !G.ropeUsed && G.lakeCrossed === false) {
    log("The lake blocks your path. You need something to help you cross safely.", "danger");
    return;
  }

  if (G.currentRoom === 'deep_cave') {
    if (dir === 'north') {
      log("You scramble back through the dark passage toward the cave entrance...", "narrative");
    }
  }

  if (G.currentRoom === 'deep_woods' && dir === 'south') {
    if (G.entityRoom === 'deep_woods' && G.entityActive) {
      log(`You run. ${G.entityName} crashes through the trees behind you. You barely escape to the south!`, "danger");
      G.entityAggro = Math.min(G.entityAggro + 2, 10);
      document.getElementById('ascii-display').classList.add('shake');
      setTimeout(() => document.getElementById('ascii-display').classList.remove('shake'), 300);
    } else {
      log("You hurry back through the twisted trees.", "narrative");
    }
  }

  const newRoom = room.exits[dir];
  if (!newRoom) {
    log("You can't go that way. Dense undergrowth blocks your path.", "system");
    return;
  }

  if (newRoom === 'dark_cave' && !G.torchLit && !ROOMS.dark_cave.lit) {
    log("Pitch darkness yawns before you. You need a light source to navigate safely.", "danger");
    log("You could still ENTER if you're brave enough...", "system");
    return;
  }

  if (newRoom === 'deep_woods') {
    if (!G.deepWoodsWarning) {
      log("The trees grow thicker as you approach. The air turns ice cold.", "danger");
      log("Something ancient and malevolent lurks in the deep woods. Proceed carefully.", "danger");
      G.deepWoodsWarning = true;
    }
  }

  G.currentRoom = newRoom;
  advanceTurn();
  describeRoom();
}

function cmdLook(target) {
  const room = ROOMS[G.currentRoom];

  if (target) {
    if (target === 'moon' || target === 'sky') {
      if (G.moonlitNow) {
        log("The moon hangs full and bright above. Silver light streams down. It feels... protective.", "moon");
      } else {
        log("Clouds have moved across the moon. The forest darkens. You feel exposed.", "danger");
      }
      return;
    }
    if (target.includes('pedestal') || target.includes('shrine')) {
      if (G.currentRoom === 'ancient_shrine') {
        log("The stone pedestal has a crescent-shaped depression. It looks like something could fit here...", "narrative");
        return;
      }
    }
    if (target.includes('inscription') || target.includes('wall') || target.includes('carving')) {
      if (G.currentRoom === 'dark_cave' && G.torchLit) {
        log("The ancient inscriptions read:", "narrative");
        log('"Answer the riddle of the shrine. Place the moonstone under open sky. The lake must be crossed by rope and faith."', "item");
        log("The words are burned into the stone, as if by fire.", "narrative");
        if (!G.caveExplored) { G.caveExplored = true; }
        return;
      } else if (G.currentRoom === 'dark_cave' && !G.torchLit) {
        log("You can feel carvings on the walls but it's too dark to read them.", "danger");
        return;
      }
    }
    if (target.includes('trees') || target.includes('forest')) {
      log("The trees stretch endlessly in all directions. Their branches interlock like prison bars.", "narrative");
      return;
    }
    if (target.includes('water') || target.includes('lake')) {
      if (G.currentRoom === 'underground_lake') {
        log("The water is black and perfectly still. It reflects nothing. Something has to be on the other side...", "narrative");
        return;
      }
    }
    if (target.includes('bones') || target.includes('skull')) {
      log("Old bones. Very old. Some don't look human.", "danger");
      return;
    }
    if (target.includes('cabin') || target.includes('door') || target.includes('lock')) {
      if (G.currentRoom === 'old_cabin') {
        if (G.cabinUnlocked) {
          log("The cabin door hangs open. Warm light spills from inside.", "narrative");
        } else {
          log("A heavy iron lock secures the cabin door. You need a KEY.", "narrative");
        }
        return;
      }
    }
    if (target.includes('entity') || target.includes('shadow') || target.includes('hollow') || target.includes('it')) {
      if (G.entityRoom === G.currentRoom && G.entityActive) {
        log(`You see ${G.entityDesc}. It hasn't noticed you yet.`, "entity");
      } else {
        log("You don't see it here... but that doesn't mean it's not watching.", "danger");
      }
      return;
    }
    if (target.includes('map')) {
      if (G.inventory.includes('complete_map') || G.inventory.includes('treasure_map')) {
        log("You already have the map. Type 'use map' or 'check map' to study it.", "system");
      } else if (G.inventory.includes('map_fragment_1') && G.inventory.includes('map_fragment_2')) {
        log("You have both fragments! Type 'combine map fragments' to complete the map.", "system");
      } else if (G.inventory.includes('map_fragment_1')) {
        log("You have half the map. You need the other piece.", "narrative");
      } else if (G.inventory.includes('map_fragment_2')) {
        log("You have a partial map. You need another piece.", "narrative");
      } else {
        log("You don't have a map.", "system");
      }
      return;
    }
    log(`You don't see anything special about "${target}".`, "system");
    return;
  }

  if (G.currentRoom === 'dark_cave' && !G.torchLit) {
    log("You can't see anything. The darkness is absolute.", "danger");
    return;
  }

  log(room.lookText, "narrative");

  const roomItems = getCurrentItems();
  if (roomItems.length > 0) {
    roomItems.forEach(item => {
      log(`You see a ${item.displayName} here.`, "item");
    });
  }

  if (G.currentRoom === 'old_cabin' && !G.cabinUnlocked) {
    log("The door is LOCKED. A heavy iron lock hangs on it.", "narrative");
  } else if (G.currentRoom === 'old_cabin' && G.cabinUnlocked) {
    if (!G.cabinSearched) {
      log("Inside you notice: shelves with dusty JARS, a cold FIREPLACE, and something GLINTING under the floorboards.", "item");
    } else {
      log("You've searched everything in the cabin.", "system");
    }
  }

  if (G.currentRoom === 'ancient_shrine') {
    log("The pedestal's depression is shaped like a crescent moon.", "narrative");
    if (G.shrineSolved) {
      log("The shrine glows faintly with a soft blue light.", "moon");
    }
  }
}

function cmdTake(item) {
  if (!item) { log("Take what? Be specific.", "system"); return; }
  item = item.toLowerCase();

  const roomItems = getCurrentItems();

  if (G.currentRoom === 'old_cabin' && G.cabinUnlocked) {
    if ((item === 'torch' || item === 'matches' || item === 'lantern') && !G.torchFound) {
      G.torchFound = true;
      G.inventory.push('torch');
      G.inventory.push('matches');
      log("You grab a TORCH and a box of MATCHES from the shelf.", "item");
      updateInventory();
      return;
    }
    if ((item === 'key' || item === 'old key') && G.keyLocation === 'old_cabin' && !G.keyFound) {
      G.keyFound = true;
      G.inventory.push('key');
      log("You find a rusty KEY under the floorboards!", "item");
      updateInventory();
      return;
    }
  }

  for (const ri of roomItems) {
    if (item.includes(ri.id) || item.includes(ri.displayName.toLowerCase()) || ri.aliases.some(a => item.includes(a))) {
      if (ri.takeable) {
        G.inventory.push(ri.id);
        removeRoomItem(G.currentRoom, ri.id);
        log(`You pick up the ${ri.displayName}.`, "item");
        updateInventory();
        if (ri.id === 'key') G.keyFound = true;
        if (ri.id === 'rope') G.ropeFound = true;
        if (ri.id === 'moonstone') G.moonstoneFound = true;
        return;
      } else {
        log(`You can't take the ${ri.displayName}.`, "system");
        return;
      }
    }
  }

  if (G.currentRoom === 'dense_thicket' || G.currentRoom === 'forest_edge') {
    if (item.includes('key')) {
      if (G.keyLocation === G.currentRoom && !G.keyFound) {
        G.keyFound = true;
        G.inventory.push('key');
        log("You find a rusty KEY half-buried in the mud!", "item");
        updateInventory();
        return;
      }
    }
  }

  if (item.includes('rope')) {
    if (G.ropeLocation === G.currentRoom && !G.ropeFound) {
      G.ropeFound = true;
      G.inventory.push('rope');
      log("You find a length of sturdy ROPE coiled against a rock!", "item");
      updateInventory();
      return;
    }
  }

  log(`There's nothing like "${item}" here to take.`, "system");
}

function cmdUse(item) {
  if (!item) { log("Use what?", "system"); return; }
  item = item.toLowerCase();

  if (item.includes('key') && (item.includes('cabin') || item.includes('door') || G.currentRoom === 'old_cabin')) {
    if (G.inventory.includes('key')) {
      if (G.currentRoom === 'old_cabin') {
        G.cabinUnlocked = true;
        removeItem('key');
        log("*CLICK* The old lock falls away. The cabin door creaks open.", "success");
        log("A musty smell rushes out. Warm light from your torch spills inside.", "narrative");
        ROOMS.old_cabin.locked = false;
        return;
      } else {
        log("You need to be at the cabin door to use the key.", "system");
        return;
      }
    } else {
      log("You don't have a key.", "system");
      return;
    }
  }

  if (item.includes('torch') || item.includes('match')) {
    if (G.inventory.includes('torch') && G.inventory.includes('matches')) {
      G.torchLit = true;
      G.inventory.push('lit_torch');
      removeItem('torch');
      removeItem('matches');
      log("*FWSHH* The torch sputters to life! Orange light pushes back the darkness.", "success");
      log("The shadows leap and dance. You feel braver.", "narrative");
      updateInventory();
      return;
    } else if (G.inventory.includes('torch') && !G.inventory.includes('matches')) {
      log("You have a torch but nothing to light it with. You need MATCHES.", "danger");
      return;
    } else if (G.inventory.includes('lit_torch')) {
      log("The torch is already lit.", "system");
      return;
    } else {
      log("You don't have a torch to light.", "system");
      return;
    }
  }

  if (item.includes('moonstone') || item.includes('moon stone')) {
    if (G.currentRoom === 'ancient_shrine') {
      if (G.inventory.includes('moonstone')) {
        log("You place the MOONSTONE into the crescent depression on the pedestal...", "narrative");
        if (G.moonlitNow) {
          G.shrineSolved = true;
          G.puzzlesSolved.shrine_riddle = true;
          G.puzzleCount++;
          removeItem('moonstone');
          G.moonstoneUsed = true;
          log("The moonstone catches the moonlight and BLAZES with silver fire!", "success");
          log("Ancient carvings illuminate around the circle. The shrine awakens.", "success");
          log("A section of the pedestal slides open, revealing a MAP FRAGMENT.", "item");
          G.inventory.push('map_fragment_1');
          G.altarMapFound = true;
          updateInventory();
          updatePuzzleProgress();
          return;
        } else {
          log("You place the moonstone, but nothing happens. The moon is hidden behind clouds...", "danger");
          log("The shrine needs MOONLIGHT to activate.", "system");
          return;
        }
      } else {
        log("You don't have a moonstone.", "system");
        return;
      }
    } else {
      log("This doesn't seem like the right place to use a moonstone.", "system");
      return;
    }
  }

  if (item.includes('rope')) {
    if (G.currentRoom === 'underground_lake') {
      if (G.inventory.includes('rope')) {
        log("You tie the rope to a rock and throw the other end across the lake...", "narrative");
        log("It catches on something on the far shore! The rope is taut.", "narrative");
        G.ropeUsed = true;
        removeItem('rope');
        log("Type CROSS to swim across using the rope.", "system");
        return;
      }
    } else {
      log("There's nothing to use a rope on here.", "system");
      return;
    }
  }

  if (item.includes('map') || item.includes('fragment')) {
    if (G.inventory.includes('complete_map')) {
      log("You study the completed map carefully...", "narrative");
      showMap(true);
      return;
    }
    if (G.inventory.includes('treasure_map')) {
      log("You study the treasure map. The arrows point DEEPER into the forest...", "danger");
      return;
    }
    if (G.inventory.includes('map_fragment_1') && G.inventory.includes('map_fragment_2')) {
      cmdCombine('map fragments');
      return;
    }
    if (G.inventory.includes('map_fragment_1')) {
      log("You have one piece of the map. You need the other fragment.", "narrative");
      return;
    }
    if (G.inventory.includes('map_fragment_2')) {
      log("You have one piece of the map. You need the other fragment.", "narrative");
      return;
    }
    log("You don't have any map pieces.", "system");
    return;
  }

  log(`You can't figure out how to use "${item}" here.`, "system");
}

function cmdOpen(target) {
  if (!target) { log("Open what?", "system"); return; }
  target = target.toLowerCase();

  if (target.includes('cabin') || target.includes('door')) {
    if (G.currentRoom === 'old_cabin' || G.currentRoom === 'dense_thicket') {
      if (G.cabinUnlocked) {
        log("The cabin is already unlocked.", "system");
        return;
      }
      if (G.inventory.includes('key')) {
        cmdUse('key cabin');
        return;
      }
      log("The door is locked. You need a KEY.", "danger");
      return;
    }
  }

  if (target.includes('pedestal')) {
    if (G.currentRoom === 'ancient_shrine' && G.shrineSolved) {
      log("The pedestal is already open from the moonstone activation.", "system");
      return;
    }
    log("The pedestal doesn't open like that. It has a crescent-shaped depression.", "system");
    return;
  }

  log(`You can't open "${target}".`, "system");
}

function cmdRead(target) {
  if (!target) { log("Read what?", "system"); return; }
  target = target.toLowerCase();

  if (target.includes('inscription') || target.includes('carving') || target.includes('wall')) {
    if (G.currentRoom === 'dark_cave' && G.torchLit) {
      log('"Answer the riddle of the shrine. Place the moonstone under open sky. The lake must be crossed by rope and faith."', "item");
      if (!G.caveExplored) { G.caveExplored = true; }
      return;
    } else if (G.currentRoom === 'dark_cave') {
      log("Too dark to read anything.", "danger");
      return;
    }
  }

  if (target.includes('note') || target.includes('journal') || target.includes('page')) {
    if (G.inventory.includes('secret_note') || G.currentRoom === G.secretNoteRoom) {
      log('The note reads: "I was the last one. The entity cannot cross moonlight. The shrine holds the key. Five puzzles. Five answers. Fail, and the forest takes you."', "item");
      return;
    }
  }

  if (target.includes('map') || target.includes('fragment')) {
    cmdUse('map');
    return;
  }

  log(`You can't read that.`, "system");
}

function cmdAnswer(answer) {
  if (!answer) { log("Answer what? You need to provide an answer.", "system"); return; }
  answer = answer.toLowerCase().trim();

  if (G.currentRoom === 'ancient_shrine' && !G.shrineSolved) {
    log(`The shrine whispers: "${G.riddle.q}"`, "entity");

    if (G.riddle.a.some(a => answer.includes(a) || a.includes(answer))) {
      G.puzzlesSolved.shrine_riddle = true;
      G.puzzleCount++;
      G.shrineSolved = true;
      log("The stones groan and shift. Ancient magic stirs!", "success");
      log("The pedestal illuminates. You may now place a MOONSTONE here.", "narrative");
      updatePuzzleProgress();
      return;
    } else {
      log("The shrine falls silent. That doesn't seem right...", "danger");
      G.entityAggro = Math.min(G.entityAggro + 1, 10);
      return;
    }
  }

  log("There's nothing here to answer.", "system");
}

function cmdLight(target) {
  if (!target) { log("Light what?", "system"); return; }
  if (target.includes('torch') || target.includes('fire')) {
    cmdUse('torch');
    return;
  }
  log(`You can't light "${target}".`, "system");
}

function cmdCross() {
  if (G.currentRoom === 'underground_lake') {
    if (!G.ropeUsed) {
      log("You can't cross the lake without securing a rope first. Use ROPE here first.", "danger");
      return;
    }
    log("Hand over hand, you pull yourself across the rope over the black water...", "narrative");
    log("Something moves beneath you. You feel fingers of cold brush your legs.", "danger");
    log("You scramble onto the far shore, gasping.", "narrative");
    G.lakeCrossed = true;

    if (!G.lakeMapFound) {
      G.lakeMapFound = true;
      G.inventory.push('map_fragment_2');
      log("On the far shore, wedged between rocks, you find a MAP FRAGMENT!", "item");
      updateInventory();
    }
    G.puzzlesSolved.lake_crossing = true;
    G.puzzleCount++;
    updatePuzzleProgress();
    return;
  }
  log("There's nothing to cross here.", "system");
}

function cmdSolve(args) {
  if (!args) {
    log("Usage: SOLVE [puzzle name] - attempt to solve a puzzle you've figured out.", "system");
    return;
  }
  args = args.toLowerCase();

  if (args.includes('cabin') || args.includes('lock')) {
    if (G.currentRoom === 'old_cabin' && G.cabinUnlocked && !G.puzzlesSolved.cave_inscription) {
      G.puzzlesSolved.cabin_lock = true;
      G.puzzleCount++;
      log("The cabin's secret is revealed - the inscriptions match the entity's weakness!", "success");
      log("A hidden drawer opens, revealing the cabin's final secret.", "narrative");
      updatePuzzleProgress();
      return;
    }
  }

  log(`You haven't figured out how to solve that yet.`, "system");
}

function cmdPray() {
  if (G.currentRoom === 'ancient_shrine') {
    log("You kneel before the ancient stones and close your eyes...", "narrative");
    log("A voice echoes: 'Answer my riddle, traveler. ANSWER [your answer]'", "moon");
    log(`RIDDLE: "${G.riddle.q}"`, "item");
    return;
  }
  log("You bow your head silently. The forest doesn't answer.", "narrative");
}

function cmdListen() {
  if (G.entityRoom === G.currentRoom && G.entityActive) {
    log(`You hear ${G.entityDesc} breathing. It's RIGHT HERE.`, "entity");
    G.entityAggro = Math.min(G.entityAggro + 2, 10);
    return;
  }
  const nearby = getAdjacentRooms(G.currentRoom);
  if (nearby.includes(G.entityRoom) && G.entityActive) {
    log("You hear something large moving nearby. Branches snapping. Heavy breathing.", "danger");
    return;
  }
  if (G.currentRoom === 'underground_lake') {
    log("Water drips in the distance. The silence is deafening.", "narrative");
    return;
  }
  log("You hear the wind through the trees. An owl hoots far away.", "narrative");
}

function cmdHide() {
  if (G.entityRoom === G.currentRoom && G.entityActive) {
    log("You press yourself against a tree and hold your breath...", "narrative");
    if (rand(1, 100) > 50) {
      log("It passes by without noticing you. You are safe... for now.", "success");
      G.entityAggro = Math.max(G.entityAggro - 2, 0);
    } else {
      log(`It found you. ${G.entityName} SCREAMS directly at you.`, "entity");
      document.getElementById('game-screen').classList.add('screen-flash');
      setTimeout(() => document.getElementById('game-screen').classList.remove('screen-flash'), 200);
      G.entityAggro = Math.min(G.entityAggro + 3, 10);
      G.health = (G.health || 5) - 2;
      if (G.health <= 0) { entityKill(); return; }
      log(`The entity recoils but doesn't attack fully. The moonlight saved you. HP: ${G.health}/5`, "danger");
    }
    return;
  }
  log("You crouch behind a tree. Nothing happens. You feel silly.", "narrative");
}

function cmdRun(dir) {
  if (!dir) { log("Run where? Give a direction.", "system"); return; }
  if (G.entityRoom === G.currentRoom && G.entityActive) {
    log("You sprint in panic!", "danger");
    G.entityAggro = Math.max(G.entityAggro - 1, 0);
  }
  cmdGo(dir);
}

function cmdThrow(item) {
  if (!item) { log("Throw what?", "system"); return; }
  if (item.includes('moonstone') && G.currentRoom === 'ancient_shrine') {
    cmdUse('moonstone');
    return;
  }
  if (G.inventory.includes(item) || G.inventory.some(i => i.includes(item))) {
    log("You hurl it into the darkness. It crashes somewhere far away.", "narrative");
    removeItem(item);
    if (rand(1,3) === 1) {
      log("Something growls in the distance...", "danger");
      G.entityAggro = Math.min(G.entityAggro + 1, 10);
    }
    updateInventory();
  } else {
    log("You don't have that to throw.", "system");
  }
}

function cmdCombine(args) {
  if (!args) { log("Combine what with what?", "system"); return; }
  args = args.toLowerCase();

  if (args.includes('map') || args.includes('fragment')) {
    if (G.inventory.includes('map_fragment_1') && G.inventory.includes('map_fragment_2')) {
      if (G.puzzleCount >= G.totalPuzzles) {
        removeItem('map_fragment_1');
        removeItem('map_fragment_2');
        G.inventory.push('complete_map');
        G.hasMap = true;
        G.mapComplete = true;
        log("You carefully fit the two map fragments together...", "narrative");
        log("They fit PERFECTLY. A complete map materializes, glowing faintly.", "success");
        log("This is the true way out of the forest!", "item");
        log("Type 'use map' to study the path, then type 'escape' when ready.", "system");
        updateInventory();
        return;
      } else {
        removeItem('map_fragment_1');
        removeItem('map_fragment_2');
        G.inventory.push('treasure_map');
        log("You fit the fragments together, but... something is wrong.", "danger");
        log("The map rearranges itself. The path leads DEEPER into the forest.", "danger");
        log("This isn't a way out. It's a TRAP.", "danger");
        updateInventory();
        return;
      }
    } else {
      log("You don't have both map fragments.", "system");
      return;
    }
  }
  log("You can't combine those.", "system");
}

function cmdMap() {
  if (G.inventory.includes('complete_map')) {
    showMap(true);
  } else if (G.inventory.includes('treasure_map')) {
    showMap(false);
  } else if (G.inventory.includes('map_fragment_1') || G.inventory.includes('map_fragment_2')) {
    log("You have an incomplete map. You need both fragments.", "system");
  } else {
    log("You don't have a map.", "system");
  }
}

function showMap(good) {
  if (good) {
    log("=== TRUE MAP ===", "success");
    log("  [SHRINE] -> [CLEARING] -> [FOREST EDGE] -> FREEDOM", "success");
    log("   |", "success");
    log("  [LAKE] (crossed)", "success");
    log("  Follow the moonlit path. Stay in the light.", "success");
    log("Type ESCAPE to leave the forest.", "system");
  } else {
    log("=== TREASURE MAP ===", "danger");
    log("  [EDGE] -> [THICKET] -> [DEEP WOODS] -> ???", "danger");
    log("  The arrows point into darkness.", "danger");
    log("  This map wants you dead.", "danger");
  }
}

function cmdInventory() {
  if (G.inventory.length === 0) {
    log("Your pockets are empty.", "system");
  } else {
    log("=== INVENTORY ===", "item");
    G.inventory.forEach(i => {
      const name = i.replace(/_/g, ' ').replace('lit torch','Torch (LIT)').replace('map fragment','Map Fragment');
      log(`  - ${name.toUpperCase()}`, "item");
    });
  }
}

function cmdHelp() {
  log("=== COMMANDS ===", "system");
  log("  Movement: GO NORTH/SOUTH/EAST/WEST (or N/S/E/W)", "system");
  log("  LOOK (L) - examine surroundings", "system");
  log("  TAKE [item] - pick something up", "system");
  log("  USE [item] - use an item", "system");
  log("  OPEN [thing] - open something", "system");
  log("  READ [thing] - read something", "system");
  log("  LIGHT [thing] - light something", "system");
  log("  CROSS - cross a body of water", "system");
  log("  ANSWER [answer] - answer a riddle", "system");
  log("  PRAY - pray at a shrine", "system");
  log("  LISTEN - listen for danger", "system");
  log("  HIDE - attempt to hide", "system");
  log("  RUN [direction] - flee quickly", "system");
  log("  THROW [item] - throw something", "system");
  log("  COMBINE [items] - combine items", "system");
  log("  INVENTORY (INV/I) - check items", "system");
  log("  MAP - view map if you have one", "system");
  log("  HINT - get a contextual hint", "system");
  log("  HISTORY - view command history", "system");
  log("  CLEAR - clear the screen", "system");
}

function cmdHint() {
  const hints = [];

  if (!G.keyFound) hints.push("Look around the forest for a key. Try searching near trees...");
  if (G.keyFound && !G.cabinUnlocked) hints.push("Take the key to the cabin door. Use KEY on the cabin.");
  if (G.cabinUnlocked && !G.torchFound) hints.push("Search the cabin interior. Use LOOK to find items.");
  if (G.torchFound && !G.torchLit) hints.push("Light the torch with the matches. USE TORCH or LIGHT TORCH.");
  if (G.torchLit && !G.caveExplored) hints.push("Enter the dark cave. The torch will reveal inscriptions.");
  if (G.caveExplored && !G.moonstoneFound) hints.push("Return to the cave. Look for the MOONSTONE.");
  if (G.moonstoneFound && !G.shrineSolved) hints.push("Go to the shrine. PRAY or ANSWER the riddle.");
  if (G.shrineSolved && !G.moonstoneUsed) hints.push("Use the MOONSTONE at the shrine under moonlight.");
  if (G.moonstoneUsed && !G.ropeFound) hints.push("Find a ROPE. Check the cave entrance or forest edge.");
  if (G.ropeFound && !G.ropeUsed) hints.push("Use the ROPE at the underground lake.");
  if (!G.ropeUsed && !G.lakeCrossed) hints.push("Cross the lake to find the second map fragment.");
  if (hints.length === 0 && G.puzzleCount < 5) hints.push("Solve all five puzzles to create the true map.");
  if (G.puzzleCount >= 5 && !G.hasMap) hints.push("Combine both map fragments. Type COMBINE MAP FRAGMENTS.");

  if (hints.length > 0) {
    log("=== HINT ===", "item");
    log(hints[0], "item");
  } else {
    log("You seem to know what you're doing. Good luck.", "system");
  }
}

function cmdHistory() {
  if (G.commandHistory.length === 0) {
    log("No commands entered yet.", "system");
    return;
  }
  log("=== RECENT COMMANDS ===", "system");
  const recent = G.commandHistory.slice(-10);
  recent.forEach((c, i) => log(`  ${i + 1}. ${c}`, "system"));
}

// ---------- ITEMS SYSTEM ----------
function getCurrentItems() {
  const items = [];

  if (G.currentRoom === G.keyLocation && !G.keyFound) {
    items.push({ id: 'key', displayName: 'Rusty Key', aliases: ['rusty key'], takeable: true });
  }
  if (G.currentRoom === G.ropeLocation && !G.ropeFound) {
    items.push({ id: 'rope', displayName: 'Rope', aliases: ['coil of rope'], takeable: true });
  }
  if (G.currentRoom === 'dark_cave' && G.torchLit && !G.moonstoneFound && G.caveExplored) {
    items.push({ id: 'moonstone', displayName: 'Moonstone', aliases: ['crystal','stone'], takeable: true });
  }
  if (G.currentRoom === G.secretNoteRoom && !G.inventory.includes('secret_note')) {
    items.push({ id: 'secret_note', displayName: 'Torn Note', aliases: ['note','paper','journal'], takeable: true });
  }

  return items;
}

function removeRoomItem(room, itemId) {
  // Items are tracked by boolean flags, this is a no-op placeholder
}

function removeItem(id) {
  const idx = G.inventory.indexOf(id);
  if (idx !== -1) G.inventory.splice(idx, 1);
}

// ---------- UI ----------
function log(msg, type = 'narrative') {
  const el = document.getElementById('message-log');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = msg;
  el.appendChild(entry);
  el.scrollTop = el.scrollHeight;
}

function renderArt(key) {
  let art = ART[key] || ART.stickFigure;
  document.getElementById('ascii-display').textContent = art;
}

function updateLocation() {
  const room = ROOMS[G.currentRoom];
  document.getElementById('loc-display').textContent = room.name;
  document.getElementById('turn-display').textContent = `Turn: ${G.turn}`;
}

function updateInventory() {
  const bar = document.getElementById('inventory-bar');
  if (G.inventory.length === 0) {
    bar.textContent = 'Inventory: (empty)';
  } else {
    const names = G.inventory.map(i => i.replace(/_/g,' ').toUpperCase());
    bar.textContent = 'Inventory: ' + names.join(' | ');
  }
  bar.style.display = 'block';
}

function updatePuzzleProgress() {
  const p = G.puzzlesSolved;
  const el = document.getElementById('puzzle-progress');
  const marks = [
    p.cabin_lock ? 'X' : ' ',
    p.cave_inscription ? 'X' : ' ',
    p.shrine_riddle ? 'X' : ' ',
    p.moon_altar ? 'X' : ' ',
    p.lake_crossing ? 'X' : ' '
  ];
  el.textContent = `Puzzles: [${marks[0]}] [${marks[1]}] [${marks[2]}] [${marks[3]}] [${marks[4]}] (${G.puzzleCount}/${G.totalPuzzles})`;
}

function updateMoon() {
  const indicator = document.getElementById('moon-indicator');
  if (G.moonlitNow) {
    indicator.classList.add('active');
  } else {
    indicator.classList.remove('active');
  }
}

function showEntityWarning(show) {
  const el = document.getElementById('entity-warning');
  if (show) {
    el.style.display = 'block';
    el.textContent = pick([
      `~ ${G.entityName} is nearby... ~`,
      `~ You feel ${G.entityName} watching... ~`,
      `~ Something breathes in the dark... ~`,
      `~ The shadows shift around you... ~`,
      `~ It knows you are here... ~`
    ]);
  } else {
    el.style.display = 'none';
  }
}

function describeRoom() {
  const room = ROOMS[G.currentRoom];
  updateLocation();
  updateMoon();

  let artKey = G.currentRoom;
  if (G.currentRoom === 'dark_cave' && G.torchLit) artKey = 'dark_cave_lit';
  if (G.currentRoom === 'old_cabin' && G.cabinUnlocked) artKey = 'old_cabin_lit';
  if (G.currentRoom === 'underground_lake' && G.ropeUsed) artKey = 'underground_lake_crossed';

  renderArt(artKey);

  if (G.currentRoom !== 'dark_cave' || G.torchLit) {
    log(`--- ${room.name} ---`, "system");
    log(room.description, "narrative");
  }

  const roomItems = getCurrentItems();
  if (roomItems.length > 0) {
    roomItems.forEach(item => {
      log(`You notice a ${item.displayName} here.`, "item");
    });
  }

  const exits = Object.keys(room.exits);
  log(`Exits: ${exits.map(e => e.toUpperCase()).join(', ')}`, "system");

  if (room.moonExposed && G.moonlitNow) {
    log("Moonlight surrounds you. You feel safe here.", "moon");
  }

  if (G.currentRoom === 'ancient_shrine' && !G.shrineSolved) {
    log("The shrine whispers: 'PRAY to hear my riddle...'", "entity");
  }

  if (G.entityRoom === G.currentRoom && G.entityActive) {
    log(`WARNING: ${G.entityName} is in this room!`, "entity");
    showEntityWarning(true);
    document.getElementById('ascii-display').classList.add('shake');
    setTimeout(() => document.getElementById('ascii-display').classList.remove('shake'), 300);
  } else {
    const nearby = getAdjacentRooms(G.currentRoom);
    if (nearby.includes(G.entityRoom) && G.entityActive) {
      showEntityWarning(true);
    } else {
      showEntityWarning(false);
    }
  }

  if (G.currentRoom === 'deep_woods' && G.entityActive) {
    log(`This is ${G.entityName}'s domain. The air reeks of decay.`, "entity");
    if (!G.moonlitNow) {
      log("There is no moonlight here. You are in grave danger.", "danger");
      G.entityAggro = Math.min(G.entityAggro + 2, 10);
    }
  }
}

// ---------- GAME MECHANICS ----------
function advanceTurn() {
  G.turn++;

  if (G.turn % G.moonCycle === 0) {
    G.moonlitNow = !G.moonlitNow;
    if (G.moonlitNow) {
      log("The clouds part. Moonlight floods the forest.", "moon");
    } else {
      log("Clouds cover the moon. Darkness deepens.", "danger");
    }
  }

  G.entityMoveTimer--;
  if (G.entityMoveTimer <= 0 && G.turn > 5) {
    moveEntity();
    G.entityMoveTimer = rand(2, 5);
  }

  if (G.entityRoom === G.currentRoom && G.entityActive) {
    if (G.moonlitNow && ROOMS[G.currentRoom].moonExposed) {
      log(`${G.entityName} SHRIEKS as moonlight burns it! It retreats into the shadows!`, "success");
      G.entityRoom = pick(Object.keys(ROOMS).filter(r => !ROOMS[r].moonExposed));
      G.entityAggro = Math.max(G.entityAggro - 3, 0);
    } else {
      entityEncounter();
    }
  } else if (G.entityAggro >= 8 && G.turn % 2 === 0) {
    log(pick([
      "You hear something massive moving toward you...",
      "The trees crack. Something is hunting.",
      "Whispers surround you. It's getting closer.",
      "The temperature drops. It's near."
    ]), "danger");
  }

  if (G.puzzleCount >= G.totalPuzzles && !G.hasMap) {
    if (G.inventory.includes('map_fragment_1') && G.inventory.includes('map_fragment_2')) {
      log("You have all the pieces! Type 'combine map fragments' to create the true map.", "success");
    }
  }

  if (G.entityAggro >= 10) {
    entityKill();
  }
}

function moveEntity() {
  if (!G.entityActive) {
    if (G.turn >= 8 || G.entityAggro >= 3) {
      G.entityActive = true;
      G.entityRoom = 'deep_woods';
      log("Somewhere in the forest, something awakens.", "entity");
    }
    return;
  }

  const adjacent = getAdjacentRooms(G.entityRoom);
  const currentAdjacent = getAdjacentRooms(G.currentRoom);

  if (currentAdjacent.includes(G.currentRoom) || G.entityRoom === G.currentRoom) {
    G.entityRoom = pick(adjacent.filter(r => r !== G.currentRoom || rand(1,3) === 1));
  } else {
    let moved = false;
    if (rand(1,3) === 1) {
      G.entityRoom = pick(adjacent);
      moved = true;
    }
    if (G.entityAggro >= 5 && !moved) {
      const roomsNearPlayer = getAdjacentRooms(G.currentRoom);
      const closer = roomsNearPlayer.filter(r => !ROOMS[r].moonExposed || !G.moonlitNow);
      if (closer.length > 0) {
        G.entityRoom = pick(closer);
      }
    }
  }
}

function getAdjacentRooms(roomId) {
  const room = ROOMS[roomId];
  if (!room) return [];
  return Object.values(room.exits);
}

function entityEncounter() {
  if (G.moonlitNow && ROOMS[G.currentRoom].moonExposed) {
    log(`${G.entityName} lunges at you but the moonlight sears its flesh! It howls and retreats!`, "success");
    G.entityRoom = pick(Object.keys(ROOMS).filter(r => !ROOMS[r].moonExposed && r !== G.currentRoom));
    G.entityAggro = Math.max(G.entityAggro - 2, 0);
    return;
  }

  const damage = rand(1, 3);
  G.health = (G.health || 5) - damage;
  log(`!!! ${G.entityName} ATTACKS !!!`, "entity");
  log(`${G.entityDesc} strikes at you! You take ${damage} damage!`, "danger");
  document.getElementById('game-screen').classList.add('screen-flash');
  document.getElementById('ascii-display').classList.add('shake');
  setTimeout(() => {
    document.getElementById('game-screen').classList.remove('screen-flash');
    document.getElementById('ascii-display').classList.remove('shake');
  }, 300);

  if (G.health <= 0) {
    entityKill();
  } else {
    log(`You stumble back. HP: ${G.health}/5. You must escape or find moonlight!`, "danger");
    G.entityAggro = Math.min(G.entityAggro + 1, 10);
  }
}

function entityKill() {
  G.gameOver = true;
  const screen = document.getElementById('ending-screen');
  const art = document.getElementById('ending-art');
  const title = document.getElementById('ending-title');
  const text = document.getElementById('ending-text');

  document.getElementById('game-screen').style.display = 'none';
  screen.style.display = 'flex';

  art.textContent = ART.bad_ending;
  art.style.color = '#8800ff';
  title.textContent = 'CONSUMED';
  title.style.color = '#8800ff';
  text.innerHTML = `
    <p>${G.entityName} found you in the darkness.</p>
    <p>${G.entityDesc} wrapped around you, pulling you into the earth.</p>
    <p>Your screams echoed through the forest, but no one was left to hear them.</p>
    <p style="margin-top:15px;color:#8800ff;">The forest remembers you now. It always will.</p>
    <p style="margin-top:10px;color:#444;">Puzzles solved: ${G.puzzleCount}/${G.totalPuzzles}</p>
    <p style="color:#444;">Turns survived: ${G.turn}</p>
  `;
}

function checkEscape() {
  if (G.inventory.includes('complete_map') || G.inventory.includes('treasure_map')) {
    if (G.inventory.includes('complete_map')) {
      goodEnding();
    } else {
      badEnding();
    }
    return;
  }
  log("You don't have a complete map yet. You can't escape.", "system");
}

function goodEnding() {
  G.gameOver = true;
  const screen = document.getElementById('ending-screen');
  const art = document.getElementById('ending-art');
  const title = document.getElementById('ending-title');
  const text = document.getElementById('ending-text');

  document.getElementById('game-screen').style.display = 'none';
  screen.style.display = 'flex';

  art.textContent = ART.good_ending;
  art.style.color = 'var(--moon)';
  title.textContent = 'ESCAPED';
  title.style.color = 'var(--moon)';
  text.innerHTML = `
    <p>You follow the map's path by moonlight, staying in the silver glow.</p>
    <p>${G.entityName} howls from the shadows but cannot follow.</p>
    <p>The trees thin. The air warms. You see stars.</p>
    <p style="margin-top:15px;color:var(--moon);">You stumble out of the forest and onto a moonlit road.</p>
    <p style="margin-top:10px;color:var(--green);">You are FREE.</p>
    <p style="margin-top:15px;color:#444;">All ${G.totalPuzzles} puzzles solved. The moon guided you home.</p>
    <p style="color:#444;">Turns: ${G.turn}</p>
  `;
}

function badEnding() {
  G.gameOver = true;
  const screen = document.getElementById('ending-screen');
  const art = document.getElementById('ending-art');
  const title = document.getElementById('ending-title');
  const text = document.getElementById('ending-text');

  document.getElementById('game-screen').style.display = 'none';
  screen.style.display = 'flex';

  art.textContent = ART.bad_ending;
  art.style.color = 'var(--accent)';
  title.textContent = 'LOST FOREVER';
  title.style.color = 'var(--accent)';
  text.innerHTML = `
    <p>You followed the treasure map eagerly, ignoring the warning signs.</p>
    <p>The path grew narrower. Darker. The trees closed in.</p>
    <p>The map led you to a clearing where the moon could not reach.</p>
    <p style="margin-top:15px;color:var(--accent);">${G.entityName} was waiting.</p>
    <p style="margin-top:10px;color:var(--accent);">It always knew you would come.</p>
    <p style="margin-top:15px;color:#444;">Only ${G.puzzleCount}/${G.totalPuzzles} puzzles solved.</p>
    <p style="color:#444;">The forest claimed another soul. Turn: ${G.turn}</p>
    <p style="margin-top:10px;color:#666;">The incomplete map was a lie. It was always a lie.</p>
  `;
}

// ---------- INPUT ----------
function submitCommand() {
  const input = document.getElementById('command-input');
  const cmd = input.value.trim();
  if (!cmd || G.gameOver) return;

  input.value = '';

  if (cmd.toLowerCase() === 'escape') {
    checkEscape();
    return;
  }

  parseCommand(cmd);
}

function sendCmd(cmd) {
  document.getElementById('command-input').value = cmd;
  submitCommand();
}

function setupInput() {
  const input = document.getElementById('command-input');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (G.historyIndex > 0) {
        G.historyIndex--;
        input.value = G.commandHistory[G.historyIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (G.historyIndex < G.commandHistory.length - 1) {
        G.historyIndex++;
        input.value = G.commandHistory[G.historyIndex] || '';
      } else {
        G.historyIndex = G.commandHistory.length;
        input.value = '';
      }
    }
  });
}

// ---------- GAME START ----------
function startGame() {
  initGameState();
  G.health = 5;

  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'flex';

  log("=== THE HOLLOW WOODS ===", "system");
  log("", "system");
  log("You awaken at the edge of a forest. You don't remember how you got here.", "narrative");
  log("The moon hangs above, its light your only comfort.", "narrative");
  log("You hear something breathing in the trees.", "danger");
  log("Something that can't survive the moonlight.", "danger");
  log("", "system");
  log("Find all five puzzles. Collect the map. Escape the forest.", "narrative");
  log("Or be consumed by what lurks in the dark.", "danger");
  log("", "system");
  log("Type HELP for commands. Type HINT if you're stuck.", "system");
  log("", "system");

  updatePuzzleProgress();
  updateInventory();
  describeRoom();

  document.getElementById('command-input').focus();
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  setupInput();
});

// Touch handling for mobile
document.addEventListener('touchstart', () => {
  setTimeout(() => {
    const input = document.getElementById('command-input');
    if (input && document.getElementById('game-screen').style.display !== 'none') {
      input.blur();
      input.focus();
    }
  }, 100);
});
