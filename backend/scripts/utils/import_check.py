import importlib
import sys
import traceback
import os

def main():
    print('CWD:', os.getcwd())
    print('SYS.PATH:')
    for p in sys.path[:10]:
        print('  ', p)
    try:
        importlib.import_module('app.main')
        print('IMPORT_OK')
    except Exception:
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
