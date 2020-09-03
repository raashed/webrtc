import {Component, ElementRef, ViewChild} from '@angular/core';
import {SocketService} from './socket.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    @ViewChild('localVideo', {static: false}) localVideo: ElementRef;
    @ViewChild('remoteVideo', {static: false}) remoteVideo: ElementRef;
    isAlreadyCalling: boolean;

    constructor(public socketService: SocketService) {
        this.initCamera({video: true, audio: true}).then();
        this.receiveAnswer();
        // this.initCamera({video: true, audio: false}).then();
        // this.initCamera({video: false, audio: true}).then();
        this.isAlreadyCalling = false;
        this.socketService.rTCPeerConnection.ontrack = async ({streams: [stream]}) => {
            const video: HTMLVideoElement = this.remoteVideo.nativeElement;
            console.log(stream);
            if (this.remoteVideo) {
                video.srcObject = stream;
                video.play().then();
            }
        };
    }

    async initCamera(config: any): Promise<void> {
        try {
            let stream = null;
            const browser = navigator as any;
            browser.getUserMedia = (browser.getUserMedia ||
                browser.webkitGetUserMedia ||
                browser.mozGetUserMedia ||
                browser.msGetUserMedia);
            stream = await browser.mediaDevices.getUserMedia(config);
            const video: HTMLVideoElement = this.localVideo.nativeElement;
            video.srcObject = stream;
            video.play().then();
            stream.getTracks().forEach(track => this.socketService.rTCPeerConnection.addTrack(track, stream));
            console.log(stream);
        } catch (err) {
            if (err.name === 'NotFoundError') {
                alert('you have no video camera on your device. call will not work');
            } else if (err.name === 'NotAllowedError') {
                alert('you have no permission for video camera. call will not work');
            } else if (err.name === 'TypeError') {
                alert('Nothing is working now. call will not work');
            } else {
                console.log(err.name);
            }
        }
    }

    async call(socketId: string): Promise<void> {
        const offer = await this.socketService.rTCPeerConnection.createOffer();
        await this.socketService.rTCPeerConnection.setLocalDescription(new RTCSessionDescription(offer));
        this.socketService.offer(offer, socketId);
    }

    receiveAnswer(): void {
        this.socketService.socketInfo.fromEvent<{ answer: any, from: any }>('answer-made').subscribe(
            async data => {
                await this.socketService.rTCPeerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                if (!this.isAlreadyCalling) {
                    this.call(data.from).then(() => {
                        this.isAlreadyCalling = true;
                    });
                }
            }
        );
    }
}
