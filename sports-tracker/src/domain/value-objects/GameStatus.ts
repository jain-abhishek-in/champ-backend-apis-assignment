export enum GameStatusEnum {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  FINISHED = 'FINISHED'
}

export class GameStatus {
  private readonly status: GameStatusEnum;

  constructor(status: GameStatusEnum) {
    this.status = status;
  }

  static scheduled(): GameStatus {
    return new GameStatus(GameStatusEnum.SCHEDULED);
  }

  static live(): GameStatus {
    return new GameStatus(GameStatusEnum.LIVE);
  }

  static finished(): GameStatus {
    return new GameStatus(GameStatusEnum.FINISHED);
  }

  isLive(): boolean {
    return this.status === GameStatusEnum.LIVE;
  }

  isFinished(): boolean {
    return this.status === GameStatusEnum.FINISHED;
  }

  isScheduled(): boolean {
    return this.status === GameStatusEnum.SCHEDULED;
  }

  canScore(): boolean {
    return this.isLive();
  }

  getValue(): GameStatusEnum {
    return this.status;
  }

  toString(): string {
    return this.status;
  }

  equals(other: GameStatus): boolean {
    return this.status === other.status;
  }
}