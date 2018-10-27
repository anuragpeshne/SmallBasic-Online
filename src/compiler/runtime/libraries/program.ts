import { ExecutionMode, ExecutionState, ExecutionEngine } from "../../execution-engine";
import { ValueKind } from "../values/base-value";
import { NumberValue } from "../values/number-value";
import { LibraryTypeInstance, LibraryPropertyInstance, LibraryMethodInstance, LibraryEventInstance } from "../libraries";

export class ProgramLibrary implements LibraryTypeInstance {
    private executePause(engine: ExecutionEngine, mode: ExecutionMode): void {
        if (engine.state === ExecutionState.Paused) {
            engine.state = ExecutionState.Running;
        } else if (mode === ExecutionMode.Debug) {
            engine.state = ExecutionState.Paused;
        }
    }

    private executeDelay(engine: ExecutionEngine): void {
       const duration = engine.popEvaluationStack().tryConvertToNumber();
       if (duration.kind === ValueKind.Number) {
           const durationNum :number = (duration as NumberValue).value;
           if (durationNum > 0) {
               engine.pause(durationNum);
           }
       }
    }

    private executeEnd(engine: ExecutionEngine): void {
        engine.terminate();
    }

    public readonly methods: { readonly [name: string]: LibraryMethodInstance } = {
        Delay: { execute: this.executeDelay.bind(this) },
        Pause: { execute: this.executePause.bind(this) },
        End: { execute: this.executeEnd.bind(this) }
    };

    public readonly properties: { readonly [name: string]: LibraryPropertyInstance } = {};

    public readonly events: { readonly [name: string]: LibraryEventInstance } = {};
}
