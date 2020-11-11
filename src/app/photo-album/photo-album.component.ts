import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireStorage } from '@angular/fire/storage';
import firebase from 'firebase/app';
import { Subscription } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

@Component({
  selector: 'app-photo-album',
  templateUrl: './photo-album.component.html',
  styleUrls: ['./photo-album.component.css'],
})
export class PhotoAlbumComponent implements OnInit {
  photo = { title: '', file: '' };
  user: firebase.User;
  userSub: Subscription;
  photoServerURL$;
  uploadedImgURL;

  constructor(
    private afAuth: AngularFireAuth,
    private afStorage: AngularFireStorage
  ) {}

  ngOnInit(): void {
    this.afAuth.authState.subscribe((user) => {
      this.user = user;
    });
  }

  onFileChange(e) {
    console.log(e.target.files[0]);
    this.photo.file = e.target.files[0];
  }

  postPhoto() {
    // https://github.com/angular/angularfire/blob/master/docs/storage/storage.md

    // 1- retrieve user id
    const uid = this.user.uid;

    // 2 - create a path and retrieve a reference from where we're pointing to
    const photoPathOnServer = `personal-space/${uid}/${this.photo.title}`;
    const photoRef = this.afStorage.ref(photoPathOnServer);

    // 3 - upload!
    const currentUpload = this.afStorage.upload(
      photoPathOnServer,
      this.photo.file
    );
    currentUpload.catch((err) => console.error(err));

    // Listening to retrieve the photo URL
    //!\ do NOT try to retrieve the URL too soon => use finalize operator to wait for the Observable to be completed
    currentUpload
      .snapshotChanges()
      .pipe(
        tap((val) => console.log('before finalize()', val)),
        finalize(() => {
          this.photoServerURL$ = photoRef.getDownloadURL();
          console.log('photoServerURL', this.photoServerURL$);

          this.photoServerURL$.subscribe((data) => {
            console.log('data ', data);
            this.uploadedImgURL = data;
          });
        })
      )
      .subscribe();

    // clear form
    this.photo = { file: '', title: '' };
  }
}
