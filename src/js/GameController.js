import themes from './themes';
import Bowman from './bowman';
import Swordsman from './swordsman';
import Magician from './magician';
import Undead from './undead';
import Vampire from './vampire';
import Daemon from './daemon';
import { generateTeam } from './generators';
import PositionedCharacter from './PositionedCharacter';
import GamePlay from './GamePlay';
import GameState from './GameState';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.charactersCount = 3;
    this.maxLevel = 4;
    this.selectedCell = undefined;
    this.turn = 'user';
    this.level = 1;
    this.points = 0;
    this.boardLocked = false;
    this.userTeam = [];
    this.enemyTeam = [];
    this.currentTheme = themes.prairie;
  }

  init() {
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addNewGameListener(this.newGame.bind(this));
    this.gamePlay.addLoadGameListener(this.loadGame.bind(this));
    this.gamePlay.addSaveGameListener(this.saveGame.bind(this));
    this.gamePlay.drawUi(themes.prairie);
    this.startingTeams();
    this.gamePlay.redrawPositions(this.userTeam.concat(this.enemyTeam));
  }

  startingTeams() {
    const userPositions = Array.from(this.startingPosition(this.gamePlay.boardSize, 'user'));
    const enemyPositions = Array.from(this.startingPosition(this.gamePlay.boardSize, 'enemy'));
    this.userTeam = generateTeam([Swordsman, Bowman, Magician], this.maxLevel, this.charactersCount);
    this.enemyTeam = generateTeam([Undead, Vampire, Daemon], this.maxLevel, this.charactersCount);
    this.userTeam = this.userTeam.map((e) => new PositionedCharacter(e.value, userPositions.shift()));
    this.enemyTeam = this.enemyTeam.map((e) => new PositionedCharacter(e.value, enemyPositions.shift()));
  }

  newGame() {
    this.userTeam = [];
    this.enemyTeam = [];
    this.selectedCell = undefined;
    this.turn = 'user';
    this.level = 1;
    this.points = 0;
    this.boardLocked = false;
    this.init();
  }

  saveGame() {
    const currentGameState = {
      userTeam: this.userTeam,
      enemyTeam: this.enemyTeam,
      selectedCell: this.selectedCell,
      level: this.level,
      points: this.points,
      currentTheme: this.currentTheme,
    };
    this.stateService.save(GameState.from(currentGameState));
    GamePlay.showMessage('Игра сохранена');
  }

  loadGame() {
    try {
      const loadGameState = this.stateService.load();
      if (loadGameState) {
        this.userTeam = loadGameState.userTeam;
        this.enemyTeam = loadGameState.enemyTeam;
        this.selectedCell = loadGameState.selected;
        this.level = loadGameState.level;
        this.points = loadGameState.points;
        this.gamePlay.drawUi(this.currentTheme);
        this.gamePlay.redrawPositions(this.userTeam.concat(this.enemyTeam));
        this.turn = 'user';
      }
    } catch (e) {
      GamePlay.showMessage('Не удалось загрузить игру');
      this.newGame();
    }
  }

  chooseCurrentTheme() {
    if (this.level === 1) {
      this.currentTheme === themes.prairie;
    }
    if (this.level === 2) {
      this.currentTheme === themes.desert;
    }
    if (this.level === 3) {
      this.currentTheme === themes.arctic;
    }
    if (this.level === 4) {
      this.currentTheme === themes.mountain;
    } else {
      throw new Error('Ошибка загрузки карты');
    }
  }

  startingPosition(size, side) {
    const positions = [];
    const positionsSet = new Set();
    if (side === 'user') {
      positions.push(0);
      positions.push(1);
      for (let i = 0; i < size ** 2; i += 1) {
        if (i % size === 0) {
          positions.push(i);
          positions.push(i + 1);
        }
      }
    } else {
      for (let i = 0; i < size ** 2; i += 1) {
        if ((i + 1) % size === 0) {
          positions.push(i);
          positions.push(i - 1);
        }
      }
    }
    while (positionsSet.size !== this.charactersCount) {
      positionsSet.add(positions[Math.floor(Math.random() * Math.floor(positions.length))]);
    }
    return positionsSet;
  }

  onCellClick(index) {
    // TODO: react to click
    if (this.turn !== 'user' || this.boardLocked) return false;
    const userCharactersPositions = this.userTeam.map((e) => e.position);
    const deselection = () => {
      this.gamePlay.deselectCell(index);
      this.gamePlay.deselectCell(this.selectedCell);
      this.selectedCell = undefined;
      this.gamePlay.setCursor('auto');
    };

    const cellNotAvaliable = () => {
      if (userCharactersPositions.indexOf(index) === -1) {
        GamePlay.showError('Поищи своего персонажа получше :)');
        return null;
      }
      if (this.selectedCell !== undefined) {
        this.gamePlay.deselectCell(this.selectedCell);
        this.selectedCell = undefined;
      }
      this.gamePlay.selectCell(index);
      this.selectedCell = index;
    };

    const attackEnemy = (selectedCharacter) => {
      this.gamePlay.setCursor('crosshair');
      this.gamePlay.selectCell(index, 'red');
      const targetCharacter = this.enemyTeam.find((element) => element.position === index);
      const damage = Math.max(selectedCharacter.character.attack - targetCharacter.character.defence, selectedCharacter.character.attack * 0.1);
      this.gamePlay.showDamage(index, damage)
        .then(() => {
          if (!targetCharacter.character.takeDamage(damage)) this.enemyTeam.splice(this.enemyTeam.indexOf(targetCharacter), 1);
          deselection();
          this.gamePlay.redrawPositions(this.userTeam.concat(this.enemyTeam));
          this.checkLevelUp();
          this.turn = 'enemy';
          this.enemyTurn();
        });
    };

    const goToCell = (selectedCharacter) => {
      this.gamePlay.setCursor('pointer');
      this.gamePlay.selectCell(index, 'green');
      selectedCharacter.position = index;
      deselection();
      this.gamePlay.redrawPositions(this.userTeam.concat(this.enemyTeam));
      this.checkLevelUp();
      this.turn = 'enemy';
      this.enemyTurn();
    };

    if (this.selectedCell === undefined) {
      cellNotAvaliable();
    } else {
      const selectedCharacter = this.userTeam.find((element) => element.position === this.selectedCell);
      const allow = this.isAvailable(selectedCharacter, index);
      if (userCharactersPositions.indexOf(index) !== -1) {
        this.gamePlay.setCursor('pointer');
      } else if (!allow) {
        this.gamePlay.setCursor('not-allowed');
      } else if (allow.attack) {
        attackEnemy(selectedCharacter);
      } else if (allow.move) {
        goToCell(selectedCharacter);
      }
    }
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    if (this.boardLocked) return false;
    const allCharacters = this.userTeam.concat(this.enemyTeam);
    const allCharactersPositions = allCharacters.map((element) => element.position);
    if (allCharactersPositions.indexOf(index) !== -1) {
      allCharacters.forEach((element) => {
        if (element.position === index) this.gamePlay.showCellTooltip(element.character.characterInfo(), index);
      });
    }
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
    this.gamePlay.hideCellTooltip(index);
  }

  isAvailable(positionedCharacter, index) {
    const allCharacters = this.userTeam.concat(this.enemyTeam);
    function onEmptyCell(index) {
      const filledCells = allCharacters.map((element) => element.position);
      return filledCells.indexOf(index) === -1;
    }
    if (onEmptyCell(index)) {
      return this.canMove(positionedCharacter, index);
    } if (this.enemyTeam.map((element) => element.position).indexOf(index) !== -1) {
      return this.canAttack(positionedCharacter, index);
    }
  }

  canMove(positionedCharacter, index) {
    const range = positionedCharacter.character.getRange();
    const position = this.indexCalc(positionedCharacter.position);
    const target = this.indexCalc(index);
    const size = this.gamePlay.boardSize;
    const boardPosition = [];

    for (let i = 1; i <= range.move; i += 1) {
      const row = position[0];
      const column = position[1];
      if (row - i >= 0 && column + i < size) boardPosition.push(this.indexCalc([row - i, column + i]));
      if (row + i < size && column + i < size) boardPosition.push(this.indexCalc([row + i, column + i]));
      if (row + i < size && column - i >= 0) boardPosition.push(this.indexCalc([row + i, column - i]));
      if (row - i >= 0 && column - i >= 0) boardPosition.push(this.indexCalc([row - i, column - i]));
    }
    if ((position[0] === target[0] && Math.abs(position[1] - target[1]) <= range.move)
    || (position[1] === target[1] && Math.abs(position[0] - target[0]) <= range.move)
    || boardPosition.includes(index)) {
      return { move: true };
    }
    return false;
  }

  canAttack(positionedCharacter, index) {
    const range = positionedCharacter.character.getRange();
    const position = this.indexCalc(positionedCharacter.position);
    const target = this.indexCalc(index);
    if ((position[0] === target[0] && Math.abs(position[1] - target[1]) <= range.attack)
    || (position[1] === target[1] && Math.abs(position[0] - target[0]) <= range.attack)
    || (Math.abs(position[1] - target[1]) <= range.attack && Math.abs(position[0] - target[0]) <= range.attack)) {
      return { attack: true };
    }
    return false;
  }

  indexCalc(index) {
    if (Array.isArray(index)) {
      const row = index[0];
      const column = index[1];
      return row * this.gamePlay.boardSize + column;
    }
    const row = Math.floor(index / this.gamePlay.boardSize);
    const column = index % this.gamePlay.boardSize;
    return [row, column];
  }

  enemyTurn() {
    const character = this.enemyTeam[Math.floor(Math.random() * Math.floor(this.enemyTeam.length))];
    this.gamePlay.selectCell(character.position);
    const allUsersPositions = this.userTeam.map((element) => element.position);
    const position = this.indexCalc(character.position);
    const nearUser = allUsersPositions.find((element) => {
      const target = this.indexCalc(element);
      return (position[0] === target[0] && Math.abs(position[1] - target[1]) <= character.character.getRange().attack)
      || (position[1] === target[1] && Math.abs(position[0] - target[0]) <= character.character.getRange().attack)
      || (Math.abs(position[1] - target[1]) <= character.character.getRange().attack && Math.abs(position[0] - target[0]) <= character.character.getRange().attack);
    });
    const endOfTurn = () => {
      this.gamePlay.redrawPositions(this.userTeam.concat(this.enemyTeam));
      this.turn = 'user';
      this.checkLevelUp();
      this.checkLose();
    };

    if (nearUser !== undefined) {
      const targetCharacter = this.userTeam.find((element) => element.position === nearUser);
      const damage = Math.max(character.character.attack - targetCharacter.character.defence, character.character.attack * 0.1);
      this.gamePlay.selectCell(nearUser, 'red');
      this.gamePlay.showDamage(nearUser, damage)
        .then(() => {
          if (!targetCharacter.character.takeDamage(damage)) this.userTeam.splice(this.userTeam.indexOf(targetCharacter), 1);
          this.gamePlay.deselectCell(character.position);
          this.gamePlay.deselectCell(nearUser);
          endOfTurn();
        });
    } else {
      const allEnemyPositions = this.enemyTeam.map((element) => element.position);
      const allUserPositions = this.enemyTeam.map((element) => element.position);
      let allowedPosition = [];
      const size = this.gamePlay.boardSize;
      const range = character.character.getRange().move;
      const row = position[0];
      const column = position[1];
      if (row - range >= 0 && column + range < size) allowedPosition.push(this.indexCalc([row - range, column + range]));
      if (row + range < size && column + range < size) allowedPosition.push(this.indexCalc([row + range, column + range]));
      if (row + range < size && column - range >= 0) allowedPosition.push(this.indexCalc([row + range, column - range]));
      if (row - range >= 0 && column - range >= 0) allowedPosition.push(this.indexCalc([row - range, column - range]));
      if (column + range < size) allowedPosition.push(this.indexCalc([row, column + range]));
      if (column - range >= 0) allowedPosition.push(this.indexCalc([row, column - range]));
      if (row + range < size) allowedPosition.push(this.indexCalc([row + range, column]));
      if (row - range >= 0) allowedPosition.push(this.indexCalc([row - range, column]));
      allowedPosition = allowedPosition.filter((element) => allEnemyPositions.indexOf(this.indexCalc(element)) === -1);
      allowedPosition = allowedPosition.filter((element) => allUserPositions.indexOf(this.indexCalc(element)) === -1);
      const enemyMovement = allowedPosition[Math.floor(Math.random() * Math.floor(allowedPosition.length))];
      this.gamePlay.deselectCell(character.position);
      character.position = enemyMovement;
      endOfTurn();
    }
  }

  checkLevelUp() {
    if (this.enemyTeam.length > 0) return false;
    const levelUp = (landscape, addUserCharactersCount, addUserCharactersLevel, maxEnemyLevel) => {
      this.gamePlay.drawUi(landscape);
      this.userTeam.forEach((element) => {
        this.points += element.character.health;
        element.character.attack = Math.floor(Math.max(element.character.attack, element.character.attack * (1.8 - element.character.health / 100)));
        element.character.defence = Math.floor(Math.max(element.character.defence, element.character.defence * (1.8 - element.character.health / 100)));
        element.character.health += (element.character.level + 80);
        if (element.character.health > 100) element.character.health = 100;
        element.character.level += 1;
      });
      for (let i = 0; i < addUserCharactersCount; i += 1) {
        const newUserTeam = generateTeam([Swordsman, Bowman, Magician], addUserCharactersLevel, 1);
        const newPositionedCharacter = new PositionedCharacter(newUserTeam[0].value, i);
        this.userTeam.push(newPositionedCharacter);
      }
      const userTeamLength = this.userTeam.length;
      this.charactersCount = userTeamLength;
      const userPositions = Array.from(this.startingPosition(this.gamePlay.boardSize, 'user'));
      const enemyPositions = Array.from(this.startingPosition(this.gamePlay.boardSize, 'enemy'));
      this.userTeam.forEach((element) => {
        element.position = userPositions.shift();
      });
      const newEnemyTeam = generateTeam([Undead, Vampire, Daemon, Undead, Vampire, Daemon, Undead, Vampire, Daemon, Undead, Vampire, Daemon], Math.floor(Math.random() * Math.floor(maxEnemyLevel)), userTeamLength);
      newEnemyTeam.forEach((element) => {
        const newPositionedCharacter = new PositionedCharacter(element.value, enemyPositions.shift());
        this.enemyTeam.push(newPositionedCharacter);
      });
      this.gamePlay.redrawPositions(this.userTeam.concat(this.enemyTeam));
      this.level += 1;
    };
    if (this.level === 1) {
      levelUp('desert', 1, 1, 2);
    }
    if (this.level === 2) {
      levelUp('arctic', 2, 2, 3);
    }
    if (this.level === 3) {
      levelUp('mountain', 2, 3, 4);
    }
    if (this.level === 4) {
      this.endGame('Вы выиграли!');
    } else {
      throw new Error('Ошибка при загрузке нового уровня');
    }
  }

  checkLose() {
    if (this.userTeam.length > 0) return false;
    this.endGame('Вы проиграли!');
  }

  endGame(message) {
    this.locked = true;
    GamePlay.showMessage(message);
  }
}
