import { Directive, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { BehaviorSubject, Subject, from, switchMap, takeUntil } from "rxjs";

import { SearchService } from "@bitwarden/common/abstractions/search.service";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

@Directive()
export class VaultItemsComponent implements OnInit, OnDestroy {
  @Input() activeCipherId: string = null;
  @Output() onCipherClicked = new EventEmitter<CipherView>();
  @Output() onCipherRightClicked = new EventEmitter<CipherView>();
  @Output() onAddCipher = new EventEmitter();
  @Output() onAddCipherOptions = new EventEmitter();

  loaded = false;
  ciphers: CipherView[] = [];
  searchPlaceholder: string = null;
  filter: (cipher: CipherView) => boolean = null;
  deleted = false;
  organization: Organization;
  accessEvents = false;

  protected searchPending = false;

  private destroy$ = new Subject<void>();
  private searchTimeout: any = null;
  private isSearchable: boolean = false;
  private _searchText$ = new BehaviorSubject<string>("");
  get searchText() {
    return this._searchText$.value;
  }
  set searchText(value: string) {
    this._searchText$.next(value);
  }

  constructor(
    protected searchService: SearchService,
    protected cipherService: CipherService,
  ) {}

  ngOnInit(): void {
    this._searchText$
      .pipe(
        switchMap((searchText) => from(this.searchService.isSearchable(searchText))),
        takeUntil(this.destroy$),
      )
      .subscribe((isSearchable) => {
        this.isSearchable = isSearchable;
      });
  }

  ngOnDestroy(): void {
    throw new Error("Method not implemented.");
  }

  async load(filter: (cipher: CipherView) => boolean = null, deleted = false) {
    this.deleted = deleted ?? false;
    await this.applyFilter(filter);
    this.loaded = true;
  }

  async reload(filter: (cipher: CipherView) => boolean = null, deleted = false) {
    this.loaded = false;
    await this.load(filter, deleted);
  }

  async refresh() {
    await this.reload(this.filter, this.deleted);
  }

  async applyFilter(filter: (cipher: CipherView) => boolean = null) {
    this.filter = filter;
    await this.search(null);
  }

  async search(timeout: number = null, indexedCiphers?: CipherView[]) {
    this.searchPending = false;
    if (this.searchTimeout != null) {
      clearTimeout(this.searchTimeout);
    }
    if (timeout == null) {
      await this.doSearch(indexedCiphers);
      return;
    }
    this.searchPending = true;
    this.searchTimeout = setTimeout(async () => {
      await this.doSearch(indexedCiphers);
      this.searchPending = false;
    }, timeout);
  }

  selectCipher(cipher: CipherView) {
    this.onCipherClicked.emit(cipher);
  }

  rightClickCipher(cipher: CipherView) {
    this.onCipherRightClicked.emit(cipher);
  }

  addCipher() {
    this.onAddCipher.emit();
  }

  addCipherOptions() {
    this.onAddCipherOptions.emit();
  }

  isSearching() {
    return !this.searchPending && this.isSearchable;
  }

  protected deletedFilter: (cipher: CipherView) => boolean = (c) => c.isDeleted === this.deleted;

  protected async doSearch(indexedCiphers?: CipherView[]) {
    indexedCiphers = indexedCiphers ?? (await this.cipherService.getAllDecrypted());
    this.ciphers = await this.searchService.searchCiphers(
      this.searchText,
      [this.filter, this.deletedFilter],
      indexedCiphers,
    );
  }
}
