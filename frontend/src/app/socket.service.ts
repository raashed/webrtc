import {Injectable} from '@angular/core';
import {Socket} from 'ngx-socket-io';

@Injectable({
    providedIn: 'root'
})
export class SocketService {

    socketInfo: Socket;
    currentUser: string;
    users: string[] = [];
    rTCPeerConnection = new RTCPeerConnection({
        iceServers: [{
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }, {
            urls: [
                'turn:13.250.13.83:3478?transport=udp'
            ],
            username: 'YzYNCouZM1mhqhmseWk6',
            credential: 'YzYNCouZM1mhqhmseWk6'
        }]
    });

    constructor(private socket: Socket) {
        this.socketInfo = this.socket;
        this.getCurrentUser();
        this.getNewUser();
        this.receiveOffer().then();
    }

    getCurrentUser(): void {
        this.socket.fromEvent<string>('current-user').subscribe(
            d => {
                this.currentUser = d;
            }
        );
    }

    getNewUser(): void {
        this.socket.fromEvent<string[]>('users').subscribe(
            d => {
                this.users = d.filter(ele => ele !== this.currentUser);
            }
        );
    }

    offer(offer: any, to: any): void {
        this.socket.emit('call-user', {offer, to});
    }

    async receiveOffer(): Promise<void> {
        this.socket.fromEvent<{ offer: any, from: any }>('call-made').subscribe(
            async data => {
                alert(
                    `User "Socket: ${data.from}" wants to call you`
                );

                await this.rTCPeerConnection.setRemoteDescription(
                    new RTCSessionDescription(data.offer)
                );

                const answer = await this.rTCPeerConnection.createAnswer();
                await this.rTCPeerConnection.setLocalDescription(new RTCSessionDescription(answer));

                console.log(data);
                this.socket.emit('make-answer', {
                    answer,
                    to: data.from
                });
            }
        );
    }
}
