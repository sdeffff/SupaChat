import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss', './aside-home.component.scss'],
  providers: []
})
export class HomeComponent {

  constructor() {}

  public playlist = [1, 2, 3, 4];
  public activeIndex: number | null = 0;
  public i = 1;

  expand(index: number) {
    this.activeIndex = index;
  }
}