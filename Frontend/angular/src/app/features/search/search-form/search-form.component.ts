import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Subject, switchMap, debounceTime, distinctUntilChanged } from 'rxjs';
import { SearchService } from '../../../services/search.service';

@Component({
  selector: 'app-search-form',
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.css'],
  standalone: false
})
export class SearchFormComponent {
  @Input() placeholder = '';
  @Output() selectStation = new EventEmitter<any>();

  inputValue = '';
  suggestions: any[] = [];
  typing$ = new Subject<string>();

  constructor(private search: SearchService) {
    this.typing$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(text => {
          if (text.length < 2) return [];
          return this.search.searchStation(text);
        })
      )
      .subscribe(list => {
        this.suggestions = list;
      });
  }

  onInput(val: string) {
    this.typing$.next(val);
  }

  pickStation(st: any) {
    this.inputValue = st.lsname;
    this.suggestions = [];
    this.selectStation.emit(st);
  }
}
