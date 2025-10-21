// src/types/imap-extensions.ts
import { Connection } from 'imap';

declare module 'imap' {
    interface Connection {
        idle(callback: (err: Error) => void): void;
        idleStop(): void;
    }
}