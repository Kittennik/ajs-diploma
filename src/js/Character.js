export default class Character {
  constructor(level, type = 'generic') {
    this.level = level;
    this.attack = 0;
    this.defence = 0;
    this.health = 50;
    this.type = type;
    this.distance = 0;
    this.distanceAttack = 0;
    // TODO: throw error if user use "new Character()"
    if (new.target === Character) throw new Error('Запрещено создавать объекты этого класса через new Character()');
  }

  characterInfo() {
    const levelTooltip = String.fromCodePoint(0x1F396);
    const attackTooltip = String.fromCodePoint(0x2694);
    const defenceTooltip = String.fromCodePoint(0x1F6E1);
    const healthTooltip = String.fromCodePoint(0x2764);
    return `${levelTooltip} ${this.level} ${attackTooltip} ${this.attack} ${defenceTooltip} ${this.defence} ${healthTooltip} ${this.health}`;
  }

  getRange() {
    return { move: this.distance, attack: this.distanceAttack };
  }

  takeDamage(damage) {
    this.health -= damage;
    return !(this.health <= 0);
  }
}
