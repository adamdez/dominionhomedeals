"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Expand,
  MapPin,
  Share2,
  X,
} from "lucide-react";
import { SITE } from "@/lib/constants";
import { DealInterestForm } from "@/components/off-market/DealInterestForm";
import { levels, rooms, tourPhotoCount, type LevelId } from "./tour-data";
import s from "./presentation.module.css";

const roomById = (id: string) => rooms.findIndex((r) => r.id === id);
const countyUrl =
  "https://cp.spokanecounty.org/SCOUT/PropertyInformation/Summary.aspx?PID=48283.9013";

export function BlackRoadPresentation() {
  const [roomIndex, setRoomIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [galleryLevel, setGalleryLevel] = useState<LevelId | "all">("all");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const room = rooms[roomIndex];
  const level = levels.find((l) => l.id === room.level)!;
  const photo = room.photos[photoIndex] ?? room.photos[0];

  useEffect(() => {
    function fromHash() {
      const index = roomById(window.location.hash.replace("#room-", ""));
      if (index >= 0) {
        setRoomIndex(index);
        setPhotoIndex(0);
        document.getElementById("walkthrough")?.scrollIntoView();
      }
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);
  useEffect(() => {
    if (expanded) {
      dialog.current?.showModal();
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
        dialog.current?.close();
      };
    }
  }, [expanded]);
  function selectRoom(index: number, picture = 0) {
    setRoomIndex(index);
    setPhotoIndex(picture);
    window.history.replaceState(null, "", `#room-${rooms[index].id}`);
  }
  function navigateRoom(index: number) {
    selectRoom(index);
    if (window.matchMedia("(max-width: 900px)").matches)
      document
        .getElementById("tour-viewer")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function changeLevel(id: LevelId) {
    navigateRoom(rooms.findIndex((r) => r.level === id));
  }
  function changePhoto(delta: number) {
    setPhotoIndex((i) => (i + delta + room.photos.length) % room.photos.length);
  }
  function startTour() {
    selectRoom(roomById("entry"));
    document
      .getElementById("walkthrough")
      ?.scrollIntoView({ behavior: "smooth" });
  }
  async function share() {
    const url = window.location.origin + window.location.pathname;
    try {
      if (navigator.share)
        await navigator.share({
          title: "11211 E Black Rd",
          text: "Explore the Black Road property tour.",
          url,
        });
      else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link copied");
      }
    } catch {
      setShareMessage("Share this page using its address in your browser.");
    }
  }
  const allPhotos = rooms
    .flatMap((r, ri) =>
      r.photos.map((p, pi) => ({ ...p, ri, pi, level: r.level, name: r.name })),
    )
    .filter((p, i, all) => all.findIndex((x) => x.src === p.src) === i)
    .filter((p) => galleryLevel === "all" || p.level === galleryLevel);
  const galleryPhotos = galleryOpen ? allPhotos : allPhotos.slice(0, 8);
  const floorRooms = rooms.filter((r) => r.level === room.level);

  return (
    <div className={s.presentation}>
      <header className={s.header}>
        <Link
          href="/off-market"
          className={s.brand}
          aria-label="Dominion Homes off-market properties"
        >
          <span className={s.monogram}>D</span>
          <span>
            DOMINION <small>HOMES</small>
          </span>
        </Link>
        <div className={s.headerRight}>
          <span className={s.headerAddress}>11211 E Black Rd</span>
          <button
            onClick={share}
            className={s.share}
            aria-label="Share property presentation"
          >
            <Share2 size={17} />
            <span>Share</span>
          </button>
          <a className={s.headerCta} href="#inquire">
            Request details <ArrowUpRight size={16} />
          </a>
        </div>
        <span className={s.shareMessage} role="status">
          {shareMessage}
        </span>
      </header>
      <section className={s.hero} aria-labelledby="property-title">
        <Image
          src="/images/black-road/8021.webp"
          alt="Tudor-inspired Black Road home with stonework and a wooded setting"
          fill
          priority
          sizes="100vw"
          quality={90}
          className={s.heroImage}
        />
        <div className={s.heroShade} />
        <div className={s.heroContent}>
          <p className={s.eyebrow}>CHATTAROY WASHINGTON · 12.8 ACRES</p>
          <h1 id="property-title">
            A place with
            <br />
            <em>room to become yours.</em>
          </h1>
          <p className={s.heroAddress}>11211 E Black Road</p>
          <div className={s.heroActions}>
            <button className={s.lightButton} onClick={startTour}>
              Step inside <ArrowRight size={19} />
            </button>
            <a href="#gallery">
              Explore the photographs <ArrowDown size={16} />
            </a>
          </div>
        </div>
        <div className={s.heroFoot}>
          <span>DOMINION PROPERTY COLLECTION</span>
          <span>REAL PHOTOS. A ROOM-BY-ROOM WALKTHROUGH.</span>
        </div>
      </section>
      <nav className={s.sectionNav} aria-label="Presentation sections">
        <a href="#overview">The property</a>
        <a href="#walkthrough">Interactive tour</a>
        <a href="#gallery">Photographs</a>
        <a href="#purchase-options">Purchase option</a>
        <a href="#details">Details</a>
        <a href="#inquire">
          Inquire <ArrowUpRight size={14} />
        </a>
      </nav>
      <section className={s.overview} id="overview">
        <div>
          <p className={s.eyebrow}>CHARACTER. SETTING. POSSIBILITY.</p>
          <h2>
            A house you understand
            <br />
            by moving through it.
          </h2>
        </div>
        <div className={s.overviewCopy}>
          <p>
            Tall pines and open lawn surround a home with a distinctly
            individual layout. A vaulted living room. A bedroom with a window
            seat. A primary suite that opens to a loft above it all.
          </p>
          <p>
            Follow the rooms at your own pace. See how the levels connect and
            where your own vision could take shape.
          </p>
          <div className={s.facts}>
            <div>
              <strong>12.8</strong>
              <span>ACRES · COUNTY RECORD</span>
            </div>
            <div>
              <strong>3</strong>
              <span>BEDROOMS OBSERVED</span>
            </div>
            <div>
              <strong>{tourPhotoCount}</strong>
              <span>PROPERTY PHOTOGRAPHS</span>
            </div>
          </div>
          <p className={s.smallNote}>
            The walkthrough identified three bedrooms. County bedroom and area
            records differ. See property details below.
          </p>
        </div>
      </section>
      <section
        id="purchase-options"
        className={s.financing}
        aria-labelledby="financing-title"
      >
        <div className={s.financingIntro}>
          <p className={s.eyebrow}>A PROPOSED PURCHASE OPTION</p>
          <h2 id="financing-title">
            A possible path to
            <br />
            <em>buy before you sell.</em>
          </h2>
          <p>
            Your next home may not need to wait for your current home to sell.
            Ask about a purchase structure combining an assumption of the
            existing mortgage with separate funding for the remaining balance.
          </p>
          <a href="#inquire" className={s.financingCta}>
            Request proposed financing terms <ArrowUpRight size={18} />
          </a>
        </div>
        <div className={s.financingSteps}>
          <div>
            <span>01</span>
            <div>
              <h3>Explore the existing loan.</h3>
              <p>
                A qualified buyer may be able to assume the existing mortgage
                with the loan servicer’s approval.
              </p>
            </div>
          </div>
          <div>
            <span>02</span>
            <div>
              <h3>Discuss funding the balance.</h3>
              <p>
                Dominion is exploring a separate advance to help fund the
                balance needed to complete the purchase.
              </p>
            </div>
          </div>
          <div>
            <span>03</span>
            <div>
              <h3>Plan the repayment.</h3>
              <p>
                The proposed advance could be repaid from the sale of your
                current home or another agreed source. The amount and deadline
                would be set in writing.
              </p>
            </div>
          </div>
          <p className={s.financingNote}>
            Proposed structure only. Subject to buyer qualification and servicer
            approval of the assumption and any additional financing. Rates and
            costs along with funding availability and repayment terms must be
            confirmed before commitment.
          </p>
        </div>
      </section>
      <section
        id="walkthrough"
        className={s.tourSection}
        aria-labelledby="tour-title"
      >
        <div className={s.sectionHeading}>
          <div>
            <p className={s.eyebrow}>EXPLORE THE CONNECTIONS</p>
            <h2 id="tour-title">Find your way through.</h2>
          </div>
          <p>
            Choose a level. Select a room.
            <br />
            Or follow the guided tour one stop at a time.
          </p>
        </div>
        <div className={s.levels} aria-label="Choose a level">
          {levels.map((l, i) => (
            <button
              key={l.id}
              onClick={() => changeLevel(l.id)}
              aria-pressed={room.level === l.id}
              className={room.level === l.id ? s.activeLevel : ""}
            >
              <span>0{i + 1}</span>
              {l.name}
            </button>
          ))}
        </div>
        <div className={s.tourGrid} id="tour-viewer">
          <div className={s.photoColumn}>
            <div className={s.photoStage}>
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 900px) 100vw, 62vw"
                quality={85}
                className={s.roomImage}
              />
              <button
                className={s.expandButton}
                onClick={() => setExpanded(true)}
                aria-label="Expand room photo"
              >
                <Expand size={19} />
              </button>
              {room.photos.length > 1 && (
                <>
                  <button
                    className={`${s.photoArrow} ${s.previousPhoto}`}
                    onClick={() => changePhoto(-1)}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    className={`${s.photoArrow} ${s.nextPhoto}`}
                    onClick={() => changePhoto(1)}
                    aria-label="Next photo"
                  >
                    <ChevronRight />
                  </button>
                </>
              )}
              <span className={s.photoCount}>
                {String(photoIndex + 1).padStart(2, "0")} /{" "}
                {String(room.photos.length).padStart(2, "0")}
              </span>
            </div>
            <div className={s.thumbnails} aria-label="Room photographs">
              {room.photos.map((p, i) => (
                <button
                  key={p.src}
                  onClick={() => setPhotoIndex(i)}
                  aria-pressed={photoIndex === i}
                  aria-label={`View photo ${i + 1}: ${p.alt}`}
                  className={photoIndex === i ? s.selectedThumb : ""}
                >
                  <Image src={p.src} alt="" fill sizes="84px" />
                </button>
              ))}
            </div>
          </div>
          <div className={s.roomColumn}>
            <div aria-live="polite" aria-atomic="true">
              <p className={s.roomEyebrow}>
                {level.name}{" "}
                <span>· STOP {String(roomIndex + 1).padStart(2, "0")}</span>
              </p>
              <h3>{room.name}</h3>
              <p className={s.roomStory}>{room.story}</p>
            </div>
            <div className={s.mapHeader}>
              <span>
                {room.level === "grounds"
                  ? "PROPERTY EXPLORER"
                  : "ROOM CONNECTIONS"}
              </span>
              <span>SELECT A SPACE</span>
            </div>
            <div
              className={s.floorMap}
              aria-label={`${level.name} interactive schematic`}
            >
              {floorRooms.map((r) => (
                <button
                  key={r.id}
                  className={`${s.mapRoom} ${r.id === room.id ? s.selectedRoom : ""}`}
                  onClick={() => navigateRoom(roomById(r.id))}
                  aria-pressed={r.id === room.id}
                  aria-label={`Explore ${r.name}`}
                  style={{
                    left: `${r.box[0] / 5.05}%`,
                    top: `${r.box[1] / 4.1}%`,
                    width: `${r.box[2] / 5.05}%`,
                    height: `${r.box[3] / 4.1}%`,
                  }}
                >
                  <span>{r.short}</span>
                  {r.id === room.id && <i />}
                </button>
              ))}
              {(room.level === "primary" || room.level === "bedrooms") && (
                <svg
                  className={s.doorways}
                  viewBox="0 0 505 410"
                  aria-hidden="true"
                >
                  <path
                    d={
                      room.level === "primary"
                        ? "M155 110h35 M295 145v28 M295 247v28 M155 315h35 M295 338v30"
                        : "M175 170v25 M225 125h30 M310 170v25 M225 355h30"
                    }
                  />
                </svg>
              )}
              {room.level === "primary" && (
                <div className={s.upperLanding}>
                  UPPER LANDING <span>↑</span>
                </div>
              )}
              {room.level === "bedrooms" && (
                <button
                  className={s.stairLink}
                  onClick={() => changeLevel("primary")}
                  style={{ left: "66%", top: "70%", width: "28%" }}
                >
                  STAIRS UP <ArrowUpRight size={17} />
                </button>
              )}
              {room.level === "main" && (
                <>
                  <button
                    className={s.stairLink}
                    onClick={() => changeLevel("bedrooms")}
                    style={{ left: "66%", top: "44%", width: "30%" }}
                  >
                    UP TO BEDROOMS <ArrowUpRight size={15} />
                  </button>
                  <button
                    className={s.stairLink}
                    onClick={() => changeLevel("lower")}
                    style={{ left: "66%", top: "62%", width: "30%" }}
                  >
                    DOWN TO FAMILY <ArrowDown size={15} />
                  </button>
                  <span className={s.entryMarker}>FRONT ENTRY ↑</span>
                </>
              )}
              {room.level === "lower" && (
                <button
                  className={s.stairLink}
                  onClick={() => changeLevel("basement")}
                  style={{ left: "15%", top: "78%", width: "66%" }}
                >
                  CONTINUE DOWN TO BASEMENT <ArrowDown size={16} />
                </button>
              )}
            </div>
            <p className={s.mapNote}>
              {room.level === "grounds"
                ? "Photo navigation only. Not a parcel or boundary map."
                : "Walkthrough-based schematic. Not to scale. Room shapes and dimensions are approximate."}
            </p>
            <div className={s.direction}>
              <MapPin size={17} />
              <p>{room.direction}</p>
            </div>
          </div>
        </div>
        <div className={s.tourFooter}>
          <button
            onClick={() => navigateRoom(roomIndex - 1)}
            disabled={roomIndex === 0}
          >
            <ArrowLeft size={17} /> Previous stop
          </button>
          <div
            className={s.progress}
            aria-label={`Stop ${roomIndex + 1} of ${rooms.length}`}
          >
            <span
              style={{ width: `${((roomIndex + 1) / rooms.length) * 100}%` }}
            />
          </div>
          <button
            onClick={() =>
              roomIndex === rooms.length - 1
                ? document
                    .getElementById("inquire")
                    ?.scrollIntoView({ behavior: "smooth" })
                : navigateRoom(roomIndex + 1)
            }
          >
            {roomIndex === rooms.length - 1
              ? "Request details"
              : `Next · ${rooms[roomIndex + 1].short}`}
            <ArrowRight size={17} />
          </button>
        </div>
        <details className={s.roomDirectory}>
          <summary>
            See every stop in the tour <span>{rooms.length} SPACES</span>
          </summary>
          <div>
            {rooms.map((r, i) => (
              <button
                key={r.id}
                onClick={() => {
                  selectRoom(i);
                  document
                    .getElementById("walkthrough")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {String(i + 1).padStart(2, "0")} <span>{r.name}</span>
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
        </details>
      </section>
      <section className={s.featureBanner}>
        <Image
          src="/images/black-road/7950.webp"
          alt="Sunlit lawn and pine trees at Black Road"
          fill
          sizes="100vw"
        />
        <div />
        <p>
          A little more space.
          <br />
          <em>A different pace.</em>
        </p>
      </section>
      <section className={s.gallerySection} id="gallery">
        <div className={s.sectionHeading}>
          <div>
            <p className={s.eyebrow}>LOOK A LITTLE CLOSER</p>
            <h2>The photographs.</h2>
          </div>
          <p>
            Open any image for a full view.
            <br />
            Existing condition is shown throughout.
          </p>
        </div>
        <div className={s.galleryFilters} aria-label="Filter photographs">
          {[{ id: "all", name: "All photos" }, ...levels].map((l) => (
            <button
              key={l.id}
              aria-pressed={galleryLevel === l.id}
              onClick={() => {
                setGalleryLevel(l.id as LevelId | "all");
                setGalleryOpen(false);
              }}
              className={galleryLevel === l.id ? s.activeFilter : ""}
            >
              {l.name}
            </button>
          ))}
        </div>
        <div className={s.gallery}>
          {galleryPhotos.map((p) => (
            <button
              key={p.src}
              onClick={() => {
                selectRoom(p.ri, p.pi);
                setExpanded(true);
              }}
              aria-label={`Open photo: ${p.alt}`}
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(max-width:600px) 50vw, (max-width:900px) 33vw, 25vw"
              />
              <span>
                {p.name}
                <Expand size={15} />
              </span>
            </button>
          ))}
        </div>
        {!galleryOpen && allPhotos.length > 8 && (
          <button
            className={s.outlineButton}
            onClick={() => setGalleryOpen(true)}
          >
            View all {allPhotos.length} photographs <ArrowDown size={17} />
          </button>
        )}
      </section>
      <section className={s.details} id="details">
        <div>
          <p className={s.eyebrow}>THE PROPERTY AT A GLANCE</p>
          <h2>
            Character today.
            <br />
            Possibility ahead.
          </h2>
          <p>
            The setting and the architecture are the starting point. Interior
            finishes show their age. The primary bathroom needs completion. Use
            the photographs to see the opportunity and the work together.
          </p>
          <div className={s.sourceLinks}>
            <a href={countyUrl} target="_blank" rel="noopener noreferrer">
              County property record <ArrowUpRight size={15} />
            </a>
            <a
              href="https://www.zillow.com/homedetails/11211-E-Black-Rd-Chattaroy-WA-99003/23588764_zpid/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Zillow property page <ArrowUpRight size={15} />
            </a>
            <a
              href="https://www.google.com/maps/search/?api=1&query=11211+E+Black+Rd+Chattaroy+WA+99003"
              target="_blank"
              rel="noopener noreferrer"
            >
              View location <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
        <div>
          <dl className={s.detailList}>
            <div>
              <dt>Address</dt>
              <dd>
                11211 E Black Rd
                <br />
                Chattaroy WA 99003
              </dd>
            </div>
            <div>
              <dt>Land</dt>
              <dd>12.8 acres per county</dd>
            </div>
            <div>
              <dt>Built</dt>
              <dd>1982 per county</dd>
            </div>
            <div>
              <dt>Layout</dt>
              <dd>Split levels with separate living and family rooms</dd>
            </div>
            <div>
              <dt>Bedrooms</dt>
              <dd>Three identified in the walkthrough</dd>
            </div>
            <div>
              <dt>Condition</dt>
              <dd>Existing finishes. Unfinished primary bathroom.</dd>
            </div>
            <div>
              <dt>Pricing & availability</dt>
              <dd>Request current details from Dominion</dd>
            </div>
          </dl>
          <details className={s.recordNote}>
            <summary>Room counts and area records</summary>
            <p>
              The county summary checked September 22 2026 records 2 bedrooms
              and 2 full baths with a dwelling area of 2,474 square feet. The
              walkthrough identified three bedrooms plus a main-floor half bath
              and an unfinished primary bathroom. These descriptions do not
              establish permitted room counts or legal finished area.
              Lower-level and unfinished areas are shown separately in this
              tour. Buyers should verify dimensions and permitted use.
            </p>
          </details>
          <p className={s.smallNote}>
            Layout based on property photographs and the September 22
            walkthrough. This is a guided photo presentation rather than a
            measured floor plan or a 360° scan.
          </p>
        </div>
      </section>
      <section id="inquire" className={s.inquire}>
        <div>
          <p className={s.eyebrow}>YOUR NEXT CHAPTER</p>
          <h2>
            See the possibility?
            <br />
            <em>Let’s talk details.</em>
          </h2>
          <p>
            Ask Dominion for current pricing and availability along with the
            proposed loan assumption and funding terms.
          </p>
          <a className={s.phone} href={`tel:${SITE.phone}`}>
            {SITE.phone} <ArrowUpRight size={22} />
          </a>
          <Link href="/off-market" className={s.backLink}>
            <ArrowLeft size={16} /> More Dominion properties
          </Link>
        </div>
        <div className={s.formCard}>
          <h3>Request property details</h3>
          <DealInterestForm
            address="11211 E Black Rd"
            city="Chattaroy"
            state="WA"
            zip="99003"
            landingPage="/off-market/11211-e-black-rd"
            source="off-market-11211-e-black-rd"
            propertyLabel="11211 E Black Rd"
            submitLabel="Request deal details"
            messagePlaceholder="Ask about pricing or the buy-before-you-sell option."
            contactName="Dominion Homes"
            contactPhone={SITE.phone}
            contactPhoneDisplay={SITE.phone}
          />
        </div>
      </section>
      <footer className={s.footer}>
        <span>DOMINION HOMES</span>
        <p>11211 E Black Rd · Chattaroy Washington</p>
        <Link href="/privacy">Privacy</Link>
      </footer>
      <dialog
        ref={dialog}
        className={s.lightbox}
        aria-label={`${room.name} photograph viewer`}
        onCancel={() => setExpanded(false)}
        onClose={() => setExpanded(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setExpanded(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            changePhoto(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            changePhoto(-1);
          }
        }}
      >
        <div className={s.lightboxTop}>
          <div>
            <span>{level.name}</span>
            <h2>{room.name}</h2>
          </div>
          <button
            onClick={() => setExpanded(false)}
            aria-label="Close photo viewer"
          >
            <X size={25} />
          </button>
        </div>
        <div className={s.lightboxPhoto}>
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="100vw"
            quality={90}
            className={s.roomImage}
          />
          {room.photos.length > 1 && (
            <>
              <button
                className={`${s.photoArrow} ${s.previousPhoto}`}
                onClick={() => changePhoto(-1)}
                aria-label="Previous full-screen photo"
              >
                <ChevronLeft />
              </button>
              <button
                className={`${s.photoArrow} ${s.nextPhoto}`}
                onClick={() => changePhoto(1)}
                aria-label="Next full-screen photo"
              >
                <ChevronRight />
              </button>
            </>
          )}
        </div>
        <div className={s.lightboxBottom}>
          <p aria-live="polite">{photo.alt}</p>
          <span>
            {photoIndex + 1} / {room.photos.length}
          </span>
        </div>
      </dialog>
    </div>
  );
}
