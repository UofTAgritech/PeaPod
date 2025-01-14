import { IPeaPodArduino, ArduinoMessage } from './PeaPodArduino';
import { IPeaPodPublisher, PeaPodMessage } from './PeaPodPublisher';
import { stringsToTuple } from './utils';
import chalk from 'chalk';

// Convert our set of strings to a union type. TypeScript nonsense.
const DataLabels = stringsToTuple('air_temperature', 'water_level');
type TDataLabels = typeof DataLabels[number];
type SimulatorParameters = {
    [key in TDataLabels]: {
        min: number,
        max: number,
        interval: number
    }
}

function generateData(label: TDataLabels, min : number, max : number) : ArduinoMessage {
    return {
      type: 'data',
      data: {
        label: label.replace('_','-'),
        value: Math.random()*(max-min)+min
      }
  };
}

/** 
 * A simulated Arduino for generating random data.
*/
export class ArduinoSimulator implements IPeaPodArduino{
    intervals : NodeJS.Timeout[] = []
    constructor(public parameters : SimulatorParameters){}
    async stop(): Promise<void> {
        for(const interval of this.intervals){
            clearInterval(interval);
        }
    }
    async start(onMessage: (msg: ArduinoMessage) => any): Promise<void> {
        for(const label in this.parameters){
            this.intervals.push(setInterval(()=>{
                onMessage(generateData(
                    label as TDataLabels, 
                    this.parameters[label as TDataLabels].min, 
                    this.parameters[label as TDataLabels].max));
            }, this.parameters[label as TDataLabels].interval));
        }
    }
}

export class PeaPodLogger implements IPeaPodPublisher{
    async start(): Promise<void> {}
    async publish(msg: PeaPodMessage): Promise<void> {
      switch(msg.type){
        case 'data':
          for(const label of Object.keys(msg.data)){
            for(const datum of msg.data[label].batch){
              console.log(`[${chalk.magenta(msg.type.toUpperCase())}] - [${(new Date(datum.timestamp)).toLocaleTimeString()}] - ${label}: ${datum.value}`);
            }
          }
          break;
        default:
          console.log(`[${chalk.yellow(msg.type.toUpperCase())}] - ${JSON.stringify(msg.data)}`);
          break;
      }
        
    }
}